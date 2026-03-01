import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import { generateEmbedding, findRelevantChunks } from '@/lib/rag';

// Export an external API endpoint that allows running prompts via API Keys
export async function POST(req: Request, { params }: { params: Promise<{ promptId: string }> }) {
    try {
        // 1. Authenticate Request via Authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const apiKeyString = authHeader.split('Bearer ')[1].trim();

        // Find the API key in the database
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: apiKeyString },
            include: { user: { include: { settings: true } } }
        });

        if (!apiKey) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        // 2. Extract Prompt ID and Payload
        const { promptId } = await params;
        const body = await req.json().catch(() => ({}));
        const variables = body.variables || {};

        // 3. Setup User Settings (Model, OpenAI Key)
        const userSettings = apiKey.user.settings;
        const openAiKey = userSettings?.openAiKey || process.env.OPENAI_API_KEY;
        const selectedModel = userSettings?.selectedModel || 'gpt-4o-mini';

        if (!openAiKey) {
            return NextResponse.json({ error: 'OpenAI API key is not configured for this account.' }, { status: 500 });
        }

        // 4. Find the Prompt and its Published Version
        // Need to ensure the prompt belongs to the user who owns the API key
        if (!promptId) return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });

        const prompt = await prisma.prompt.findUnique({
            where: { id: promptId, userId: apiKey.user.id },
            include: {
                versions: {
                    where: { isPublished: true },
                    take: 1
                },
                documents: { select: { id: true } }
            }
        });

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt not found or access denied' }, { status: 404 });
        }

        // 5. Inject Variables into Prompt Content
        // Use the published version if it exists, otherwise fallback to the current draft
        let baseContent = prompt.versions.length > 0 ? prompt.versions[0].content : prompt.content;
        let finalContent = baseContent;

        Object.keys(variables).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalContent = finalContent.replace(regex, typeof variables[key] === 'string' ? variables[key] : String(variables[key]));
        });

        // 5.1 RAG Logic for External API
        let ragContext = "";
        if (prompt.documents.length > 0) {
            try {
                const docIds = prompt.documents.map(d => d.id);
                const queryEmbedding = await generateEmbedding(finalContent, openAiKey);
                const relevantChunks = await findRelevantChunks(queryEmbedding, docIds);

                if (relevantChunks.length > 0) {
                    ragContext = "\n\nCONTEXT (KNOWLEDGE BASE):\n" +
                        relevantChunks.map(c => c.content).join("\n---\n");
                }
            } catch (ragError) {
                console.error("External RAG Error:", ragError);
            }
        }

        // Generate response via OpenAI
        const openai = new OpenAI({ apiKey: openAiKey });
        const startTime = performance.now();

        const messages: { role: "system" | "user"; content: string }[] = [];
        if (prompt.systemPrompt || ragContext) {
            messages.push({
                role: "system",
                content: (prompt.systemPrompt || "") + ragContext
            });
        }
        messages.push({ role: "user", content: finalContent });

        const completion = await openai.chat.completions.create({
            model: selectedModel,
            messages,
        });

        const elapsed = Math.round(performance.now() - startTime);
        const text = completion.choices[0]?.message?.content || "";

        const usage = completion.usage ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
        } : undefined;

        // 6. Asynchronously update the lastUsedAt timestamp and save a TestResult (optional but good for tracking)
        Promise.all([
            prisma.apiKey.update({
                where: { id: apiKey.id },
                data: { lastUsedAt: new Date() }
            }),
            prisma.testResult.create({
                data: {
                    promptId: prompt.id,
                    input: JSON.stringify(variables),
                    output: finalContent,
                    aiResponse: text,
                    tokens: usage?.total_tokens,
                    promptTokens: usage?.prompt_tokens,
                    completionTokens: usage?.completion_tokens,
                    responseTime: elapsed,
                    isToxic: false,
                    ratings: null
                }
            })
        ]).catch(err => console.error("Error in async API usage tracking:", err));

        // 7. Return Result
        return NextResponse.json({
            success: true,
            data: {
                result: text,
                usage,
                responseTimeMs: elapsed,
                model: selectedModel
            }
        });

    } catch (error: any) {
        console.error("API Deployment Execution Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
