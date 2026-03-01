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
        const totalPrompts = await prisma.prompt.count({ where: { userId: user.id } });
        const promptsWithVersions = await prisma.prompt.findMany({
            where: { userId: user.id },
            include: { versions: true }
        });
        const totalVersions = promptsWithVersions.reduce((acc, p) => acc + p.versions.length, 0);

        // Fetch all test results for cost and token aggregation
        const testResults = await prisma.testResult.findMany({
            where: { prompt: { userId: user.id } },
            orderBy: { createdAt: 'asc' }
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

                // Guess model from somewhere, or default to 4o-mini for rough baseline if not stored in test result
                // (In a real app, model should preferably be stored per test result)
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
        })).slice(-30); // Last 30 days

        return NextResponse.json({
            success: true,
            data: {
                totalPrompts,
                totalVersions,
                totalTests: testResults.length,
                totalTokens,
                totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
                averageResponseTime,
                chartData
            }
        });

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
