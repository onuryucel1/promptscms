import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET single workflow
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
        where: { id, userId: user.id },
        include: {
            runs: { orderBy: { createdAt: 'desc' }, take: 20 },
            _count: { select: { runs: true } }
        }
    });

    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(workflow);
}

// PUT update workflow
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { name, description, nodes, edges } = body;

    const workflow = await prisma.workflow.update({
        where: { id },
        data: {
            ...(name && { name: name.trim() }),
            ...(description !== undefined && { description }),
            ...(nodes && { nodes: JSON.stringify(nodes) }),
            ...(edges && { edges: JSON.stringify(edges) }),
        }
    });

    return NextResponse.json(workflow);
}

// DELETE workflow
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.workflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
