import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { splitText, generateEmbedding } from '@/lib/rag';
const pdf = require('pdf-parse');

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

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        // Get OpenAI Key from user settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        });
        if (!settings?.openAiKey) {
            return NextResponse.json({ error: 'OpenAI API Key is missing in settings' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';
        const fileType = file.name.split('.').pop()?.toLowerCase();

        if (fileType === 'pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else {
            text = buffer.toString('utf-8');
        }

        if (!text.trim()) {
            return NextResponse.json({ error: 'Document is empty or could not be read' }, { status: 400 });
        }

        // Create the document
        const document = await prisma.document.create({
            data: {
                title: file.name,
                content: text,
                type: fileType || 'text',
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
