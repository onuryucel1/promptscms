import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Toggle the published status of a prompt version (Set as PROD)
export async function POST(req: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, versionId } = await params;

        // Verify prompt ownership
        const prompt = await prisma.prompt.findUnique({ where: { id, workspaceId: user.workspaceId! } });
        if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });

        // Unpublish all versions for this prompt
        await prisma.promptVersion.updateMany({
            where: { promptId: id },
            data: { isPublished: false }
        });

        // Publish the target version
        const publishedVersion = await prisma.promptVersion.update({
            where: { id: versionId },
            data: { isPublished: true }
        });

        return NextResponse.json(publishedVersion);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
