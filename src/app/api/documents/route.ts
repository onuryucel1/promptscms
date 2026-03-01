import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { splitText, generateEmbedding } from '@/lib/rag';

// Polyfill DOMMatrix for Node.js environment (needed by some pdf-parse/pdfjs versions)
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
    };
}

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const documents = await prisma.document.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { chunks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get OpenAI Key from user settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        });
        if (!settings?.openAiKey) {
            return NextResponse.json({ error: 'OpenAI API Key is missing in settings' }, { status: 400 });
        }

        const contentType = req.headers.get('content-type') || '';
        let title = '';
        let text = '';
        let fileType = 'text';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File;
            if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

            const buffer = Buffer.from(await file.arrayBuffer());
            fileType = file.name.split('.').pop()?.toLowerCase() || 'text';
            title = file.name;

            if (fileType === 'pdf') {
                const pdf = require('pdf-parse');
                const data = await pdf(buffer);
                text = data.text;
            } else {
                text = buffer.toString('utf-8');
            }
        } else if (contentType.includes('application/json')) {
            const body = await req.json();
            title = body.title;
            const type = body.type; // 'text' or 'qa'

            if (type === 'qa') {
                fileType = 'qa';
                // Format QA pairs into a searchable text block
                text = body.pairs.map((p: { q: string, a: string }) => `Soru: ${p.q}\nCevap: ${p.a}`).join('\n\n');
            } else {
                fileType = 'text';
                text = body.content;
            }
        } else {
            return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
        }

        if (!text.trim()) {
            return NextResponse.json({ error: 'Content is empty or could not be read' }, { status: 400 });
        }

        // Create the document
        const document = await prisma.document.create({
            data: {
                title: title || 'Başlıksız Doküman',
                content: text,
                type: fileType,
                userId: user.id
            }
        });

        // Chunk and Embed
        const chunks = splitText(text);
        const chunkPromises = chunks.map(async (chunkContent, index) => {
            const embedding = await generateEmbedding(chunkContent, settings.openAiKey!);
            return prisma.documentChunk.create({
                data: {
                    documentId: document.id,
                    content: chunkContent,
                    embedding: JSON.stringify(embedding),
                    chunkIndex: index
                }
            });
        });

        await Promise.all(chunkPromises);

        return NextResponse.json(document, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
