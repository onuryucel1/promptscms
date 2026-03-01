import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// POST /api/prompts/[id]/versions — Save a new version
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({ where: { id, workspaceId: user.workspaceId! } });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const body = await req.json();
        const { versionName, title, content } = body;

        const version = await prisma.promptVersion.create({
            data: {
                versionName,
                title,
                content,
                promptId: id,
            },
        });

        return NextResponse.json({
            id: version.id,
            versionName: version.versionName,
            title: version.title,
            content: version.content,
            savedAt: version.createdAt.getTime(),
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
