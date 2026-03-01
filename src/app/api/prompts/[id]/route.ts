import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/prompts/[id] — Get single prompt
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({
            where: { id, userId: user.id },
            include: {
                versions: { orderBy: { createdAt: 'desc' } },
                documents: { select: { id: true, title: true } }
            },
        });

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: prompt.id,
            title: prompt.title,
            content: prompt.content,
            systemPrompt: prompt.systemPrompt,
            tags: JSON.parse(prompt.tags),
            createdAt: prompt.createdAt.getTime(),
            updatedAt: prompt.updatedAt.getTime(),
            versions: prompt.versions.map(v => ({
                id: v.id,
                versionName: v.versionName,
                title: v.title,
                content: v.content,
                savedAt: v.createdAt.getTime(),
            })),
            documentIds: prompt.documents.map(d => d.id),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/prompts/[id] — Update a prompt
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { title, content, systemPrompt, tags, documentIds } = body;

        // Verify existance and ownership first
        const existing = await prisma.prompt.findUnique({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const prompt = await prisma.prompt.update({
            where: { id },
            data: {
                title,
                content,
                systemPrompt: systemPrompt || null,
                tags: tags ? JSON.stringify(tags) : undefined,
                documents: documentIds ? {
                    set: documentIds.map((docId: string) => ({ id: docId }))
                } : undefined
            },
            include: {
                versions: { orderBy: { createdAt: 'desc' } },
                documents: { select: { id: true, title: true } }
            },
        });

        return NextResponse.json({
            id: prompt.id,
            title: prompt.title,
            content: prompt.content,
            systemPrompt: prompt.systemPrompt,
            tags: JSON.parse(prompt.tags),
            createdAt: prompt.createdAt.getTime(),
            updatedAt: prompt.updatedAt.getTime(),
            versions: prompt.versions.map(v => ({
                id: v.id,
                versionName: v.versionName,
                title: v.title,
                content: v.content,
                savedAt: v.createdAt.getTime(),
            })),
            documentIds: prompt.documents.map(d => d.id),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/prompts/[id] — Delete a prompt
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const existing = await prisma.prompt.findUnique({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.prompt.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
