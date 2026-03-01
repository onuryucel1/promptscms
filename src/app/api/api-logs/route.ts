import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('promptId');
    const apiKeyId = searchParams.get('apiKeyId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter — only show logs for prompts owned by the user
    const userPromptIds = await prisma.prompt.findMany({
        where: { workspaceId: user.workspaceId! },
        select: { id: true }
    });
    const promptIds = userPromptIds.map(p => p.id);

    const where: any = {
        promptId: { in: promptIds }
    };
    if (promptId) where.promptId = promptId;
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (status) where.status = status;

    // Get logs
    const [logs, total] = await Promise.all([
        prisma.apiLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                prompt: { select: { id: true, title: true } },
            }
        }),
        prisma.apiLog.count({ where })
    ]);

    // Calculate summary stats
    const allLogs = await prisma.apiLog.findMany({
        where: { promptId: { in: promptIds } },
        select: {
            totalTokens: true,
            responseTime: true,
            status: true,
        }
    });

    const totalCalls = allLogs.length;
    const successCount = allLogs.filter(l => l.status === 'success').length;
    const errorCount = allLogs.filter(l => l.status === 'error').length;
    const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(1) : '0';
    const avgResponseTime = totalCalls > 0
        ? Math.round(allLogs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / totalCalls)
        : 0;
    const totalTokensUsed = allLogs.reduce((sum, l) => sum + (l.totalTokens || 0), 0);

    return NextResponse.json({
        logs,
        total,
        page,
        limit,
        stats: {
            totalCalls,
            successCount,
            errorCount,
            errorRate: parseFloat(errorRate),
            avgResponseTime,
            totalTokensUsed
        }
    });
}
