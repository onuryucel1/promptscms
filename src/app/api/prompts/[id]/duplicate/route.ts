import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// POST /api/prompts/[id]/duplicate — Duplicate a prompt
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const original = await prisma.prompt.findUnique({
            where: { id, workspaceId: user.workspaceId! },
        });

        if (!original) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        const duplicate = await prisma.prompt.create({
            data: {
                title: `${original.title} (kopya)`,
                content: original.content,
                systemPrompt: original.systemPrompt,
                tags: original.tags,
                workspaceId: original.workspaceId!,
                versions: {
                    create: {
                        versionName: 'V1.0',
                        title: `${original.title} (kopya)`,
                        content: original.content,
                    },
                },
            },
            include: { versions: true },
        });

        return NextResponse.json({
            id: duplicate.id,
            title: duplicate.title,
            content: duplicate.content,
            systemPrompt: duplicate.systemPrompt,
            tags: JSON.parse(duplicate.tags),
            createdAt: duplicate.createdAt.getTime(),
            updatedAt: duplicate.updatedAt.getTime(),
            versions: duplicate.versions.map(v => ({
                id: v.id,
                versionName: v.versionName,
                title: v.title,
                content: v.content,
                savedAt: v.createdAt.getTime(),
            })),
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
