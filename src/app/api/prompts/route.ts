import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/prompts — List all prompts
export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const prompts = await prisma.prompt.findMany({
            where: { workspaceId: user.workspaceId! },
            include: { versions: { orderBy: { createdAt: 'desc' } } },
            orderBy: { updatedAt: 'desc' },
        });

        const result = prompts.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            systemPrompt: p.systemPrompt,
            tags: JSON.parse(p.tags),
            createdAt: p.createdAt.getTime(),
            updatedAt: p.updatedAt.getTime(),
            versions: p.versions.map(v => ({
                id: v.id,
                versionName: v.versionName,
                title: v.title,
                content: v.content,
                savedAt: v.createdAt.getTime(),
            })),
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/prompts — Create a prompt
export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await req.json();
        const { title, content, systemPrompt, tags } = body;

        const prompt = await prisma.prompt.create({
            data: {
                title,
                content,
                systemPrompt: systemPrompt || null,
                tags: JSON.stringify(tags || []),
                workspaceId: user.workspaceId!,
                versions: {
                    create: {
                        versionName: 'V1.0',
                        title,
                        content,
                    },
                },
            },
            include: { versions: true },
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
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
