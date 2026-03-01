import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const batches = await prisma.evaluationBatch.findMany({
            where: {
                prompt: {
                    workspaceId: user.workspaceId!
                }
            },
            include: {
                prompt: { select: { title: true } },
                results: { select: { id: true, isToxic: true, ratings: true, responseTime: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        const formatted = batches.map(b => ({
            id: b.id,
            name: b.name,
            promptTitle: b.prompt.title,
            promptId: b.promptId,
            criteria: b.criteria ? JSON.parse(b.criteria) : [],
            resultsCount: b.results.length,
            createdAt: b.createdAt.getTime(),
            results: b.results.map(r => ({
                id: r.id,
                isToxic: r.isToxic,
                ratings: r.ratings ? JSON.parse(r.ratings) : null,
                responseTime: r.responseTime
            }))
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
