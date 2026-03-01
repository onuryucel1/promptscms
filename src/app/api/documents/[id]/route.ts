import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Check if document belongs to user
        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        if (document.workspaceId !== user.workspaceId!) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.document.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
