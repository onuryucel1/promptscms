import OpenAI from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding, findRelevantChunks } from "@/lib/rag";

export async function POST(req: Request) {
    try {
        const { prompt, apiKey: dynamicApiKey, systemPrompt, model, promptId } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // --- RAG Logic ---
        let ragContext = "";
        if (promptId && dynamicApiKey) {
            try {
                const promptDoc = await prisma.prompt.findUnique({
                    where: { id: promptId },
                    include: { documents: { select: { id: true } } }
                });

                if (promptDoc && promptDoc.documents.length > 0) {
                    const docIds = promptDoc.documents.map(d => d.id);
                    const queryEmbedding = await generateEmbedding(prompt, dynamicApiKey);
                    const relevantChunks = await findRelevantChunks(queryEmbedding, docIds);

                    if (relevantChunks.length > 0) {
                        ragContext = "\n\nBAĞLAM (KNOWLEDGE BASE):\n" +
                            relevantChunks.map(c => `[Kaynak: ${c.documentId}]: ${c.content}`).join("\n---\n");
                    }
                }
            } catch (ragError) {
                console.error("RAG Error skipped:", ragError);
            }
        }
        // -----------------

        const TOXIC_PATTERNS = [
            /kesinlikle garanti/i,
            /yüzde yüz çalışır/i,
            /%100 çalışır/i,
            /garanti veriyoruz/i,
            /küfür/i
        ];

        const checkToxicity = (text: string) => {
            return TOXIC_PATTERNS.some(pattern => pattern.test(text));
        };

        const apiKey = dynamicApiKey || process.env.OPENAI_API_KEY;
        const selectedModel = model || "gpt-4o-mini";

        if (!apiKey) {
            console.warn("OPENAI_API_KEY is not set. Returning a mock response.");
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockResult = `[MOCK RESPONSE — ${selectedModel}]
${ragContext ? "🤖 RAG AKTİF: Bilgi bankasından ilgili sonuçlar bulundu.\n" : ""}
**Başlık: Yapay Zeka ile ${prompt.slice(0, 40)}...**

Bu bir mock yanıttır. Gerçek yanıtlar için Settings sayfasından API anahtarınızı girin.

${systemPrompt ? `Sistem talimatı alındı: "${systemPrompt.slice(0, 50)}..."` : 'Sistem talimatı tanımlanmadı.'}
${ragContext ? `\nBAĞLAM (RAG):\n${ragContext.slice(0, 100)}...` : ""}

Prompt:
---
${prompt}
---`;

            return NextResponse.json({
                result: mockResult,
                isToxic: checkToxicity(mockResult),
                usage: { prompt_tokens: prompt.length, completion_tokens: mockResult.length, total_tokens: prompt.length + mockResult.length }
            });
        }

        const openai = new OpenAI({ apiKey });

        const messages: { role: "system" | "user"; content: string }[] = [];
        if (systemPrompt || ragContext) {
            messages.push({
                role: "system",
                content: (systemPrompt || "") + ragContext
            });
        }
        messages.push({ role: "user", content: prompt });

        const completion = await openai.chat.completions.create({
            model: selectedModel,
            messages,
        });

        const text = completion.choices[0]?.message?.content || "";
        const isToxic = checkToxicity(text);
        const usage = completion.usage ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
        } : undefined;

        return NextResponse.json({ result: text, isToxic, usage });
    } catch (error: any) {
        console.error("Error generating content:", error);
        return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 });
    }
}
