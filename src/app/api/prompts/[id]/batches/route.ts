import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/prompts/[id]/batches — Get test batches for a prompt
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({ where: { id, workspaceId: user.workspaceId! } });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const batches = await prisma.evaluationBatch.findMany({
            where: { promptId: id },
            include: { results: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/prompts/[id]/batches — Save a bulk test result array
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({ where: { id, workspaceId: user.workspaceId! } });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json();
        const { name, criteria, results } = body;

        const batch = await prisma.evaluationBatch.create({
            data: {
                promptId: id,
                name: name || `Toplu Test ${new Date().toLocaleString('tr-TR')}`,
                criteria: criteria ? JSON.stringify(criteria) : null,
                results: {
                    create: results.map((r: any) => ({
                        input: r.input,
                        output: r.output,
                        aiResponse: r.aiResponse,
                        tokens: r.tokens,
                        promptTokens: r.promptTokens,
                        completionTokens: r.completionTokens,
                        responseTime: r.responseTime,
                        isToxic: r.isToxic || false,
                        ratings: r.ratings ? JSON.stringify(r.ratings) : null,
                    }))
                }
            },
            include: { results: true }
        });

        return NextResponse.json(batch, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
