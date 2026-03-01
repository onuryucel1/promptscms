import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET all workflows for current user
export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workflows = await prisma.workflow.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { runs: true } } }
    });

    return NextResponse.json(workflows);
}

// POST create new workflow
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, description, nodes, edges } = body;

    if (!name?.trim()) {
        return NextResponse.json({ error: 'İş akışı adı gerekli.' }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
        data: {
            name: name.trim(),
            description: description || null,
            nodes: JSON.stringify(nodes || []),
            edges: JSON.stringify(edges || []),
            userId: user.id,
        }
    });

    return NextResponse.json(workflow, { status: 201 });
}
