import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/prompts/[id]/tests — Get test history for a prompt
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({ where: { id, userId: user.id } });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const tests = await prisma.testResult.findMany({
            where: { promptId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(tests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/prompts/[id]/tests — Save a new test result
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const prompt = await prisma.prompt.findUnique({ where: { id, userId: user.id } });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json();
        const { input, output, aiResponse, tokens, promptTokens, completionTokens, responseTime, isToxic, ratings } = body;

        const testResult = await prisma.testResult.create({
            data: {
                promptId: id,
                input,
                output,
                aiResponse,
                tokens,
                promptTokens,
                completionTokens,
                responseTime,
                isToxic: isToxic || false,
                ratings: ratings ? JSON.stringify(ratings) : null,
            },
        });

        return NextResponse.json(testResult, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
