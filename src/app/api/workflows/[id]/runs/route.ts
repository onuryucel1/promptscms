import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET workflow runs
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const runs = await prisma.workflowRun.findMany({
        where: { workflowId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return NextResponse.json(runs);
}

// POST save a workflow run
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { input, steps, status, totalTime } = body;

    const run = await prisma.workflowRun.create({
        data: {
            workflowId: id,
            input: input || '',
            steps: JSON.stringify(steps || []),
            status: status || 'completed',
            totalTime: totalTime || null,
        }
    });

    return NextResponse.json(run, { status: 201 });
}
