import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch counts
        const totalPrompts = await prisma.prompt.count({ where: { workspaceId: user.workspaceId! } });
        const promptsWithVersions = await prisma.prompt.findMany({
            where: { workspaceId: user.workspaceId! },
            include: {
                versions: true,
                testResults: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { updatedAt: 'desc' },
        });
        const totalVersions = promptsWithVersions.reduce((acc, p) => acc + p.versions.length, 0);

        // Knowledge Base stats
        const totalDocuments = await prisma.document.count({ where: { workspaceId: user.workspaceId! } });
        const totalChunks = await prisma.documentChunk.count({
            where: { document: { workspaceId: user.workspaceId! } }
        });

        // Fetch all test results for cost and token aggregation
        const testResults = await prisma.testResult.findMany({
            where: { prompt: { workspaceId: user.workspaceId! } },
            orderBy: { createdAt: 'desc' },
            include: { prompt: { select: { id: true, title: true } } }
        });

        let totalTokens = 0;
        let totalCostUsd = 0;
        let averageResponseTime = 0;

        // Very basic cost calculation mapping
        const costMap: Record<string, { in: number, out: number }> = {
            'gpt-4o-mini': { in: 0.150 / 1000000, out: 0.600 / 1000000 },
            'gpt-4o': { in: 5.00 / 1000000, out: 15.00 / 1000000 },
            'gpt-3.5-turbo': { in: 0.50 / 1000000, out: 1.50 / 1000000 },
        };

        const dailyStats: Record<string, { requests: number, tokens: number, cost: number }> = {};

        let totalTimeSum = 0;
        let testsWithTimeCount = 0;

        testResults.forEach(result => {
            const dateStr = result.createdAt.toISOString().split('T')[0];

            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { requests: 0, tokens: 0, cost: 0 };
            }

            dailyStats[dateStr].requests += 1;

            if (result.responseTime) {
                totalTimeSum += result.responseTime;
                testsWithTimeCount += 1;
            }

            if (result.promptTokens && result.completionTokens) {
                const tokens = result.tokens || (result.promptTokens + result.completionTokens);
                totalTokens += tokens;
                dailyStats[dateStr].tokens += tokens;

                const modelDef = costMap['gpt-4o-mini'];
                const cost = (result.promptTokens * modelDef.in) + (result.completionTokens * modelDef.out);

                totalCostUsd += cost;
                dailyStats[dateStr].cost += cost;
            }
        });

        if (testsWithTimeCount > 0) {
            averageResponseTime = Math.round(totalTimeSum / testsWithTimeCount);
        }

        // Format chart data
        const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
            date,
            requests: stats.requests,
            tokens: stats.tokens,
            cost: parseFloat(stats.cost.toFixed(6))
        })).slice(-30);

        // Recent test results (last 8)
        const recentTests = testResults.slice(0, 8).map(r => ({
            id: r.id,
            promptId: r.prompt.id,
            promptTitle: r.prompt.title,
            model: 'gpt-4o-mini', // TestResult'ta model olmadığı için varsayılan
            responseTime: r.responseTime,
            tokens: r.tokens,
            status: r.isToxic ? 'toxic' : 'success',
            createdAt: r.createdAt.toISOString(),
        }));

        // Top prompts by test count
        const topPrompts = promptsWithVersions
            .map(p => ({
                id: p.id,
                title: p.title,
                testCount: p.testResults.length,
                updatedAt: p.updatedAt.toISOString(),
            }))
            .sort((a, b) => b.testCount - a.testCount)
            .slice(0, 5);

        // Recently updated prompts (last 5)
        const recentPrompts = promptsWithVersions.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            updatedAt: p.updatedAt.toISOString(),
            versionCount: p.versions.length,
        }));

        // API Analytics stats
        const promptIds = promptsWithVersions.map(p => p.id);
        const apiLogs = await prisma.apiLog.findMany({
            where: { promptId: { in: promptIds } },
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { prompt: { select: { id: true, title: true } } }
        });

        const apiTotalCalls = apiLogs.length;
        const apiErrorCount = apiLogs.filter(l => l.status === 'error').length;
        const apiErrorRate = apiTotalCalls > 0 ? parseFloat(((apiErrorCount / apiTotalCalls) * 100).toFixed(1)) : 0;
        const apiAvgResponseTime = apiTotalCalls > 0
            ? Math.round(apiLogs.reduce((s, l) => s + (l.responseTime || 0), 0) / apiTotalCalls)
            : 0;
        const apiTotalTokens = apiLogs.reduce((s, l) => s + (l.totalTokens || 0), 0);
        const recentApiLogs = apiLogs.slice(0, 5).map(l => ({
            id: l.id,
            promptTitle: l.prompt?.title || 'Silinmiş',
            apiKeyName: l.apiKeyName || '-',
            model: l.model,
            totalTokens: l.totalTokens,
            responseTime: l.responseTime,
            status: l.status,
            createdAt: l.createdAt.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            data: {
                totalPrompts,
                totalVersions,
                totalTests: testResults.length,
                totalTokens,
                totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
                averageResponseTime,
                chartData,
                recentTests,
                topPrompts,
                recentPrompts,
                ragStats: { totalDocuments, totalChunks },
                apiStats: {
                    totalCalls: apiTotalCalls,
                    errorCount: apiErrorCount,
                    errorRate: apiErrorRate,
                    avgResponseTime: apiAvgResponseTime,
                    totalTokens: apiTotalTokens,
                    recentLogs: recentApiLogs,
                },
            }
        });

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
