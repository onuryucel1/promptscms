import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/settings — Get user settings
export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id },
        });

        return NextResponse.json({
            openAiKey: settings?.openAiKey || '',
            selectedModel: settings?.selectedModel || 'gpt-4o-mini',
            theme: settings?.theme || 'light',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/settings — Update user settings
export async function PUT(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await req.json();

        const settings = await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {
                ...(body.openAiKey !== undefined && { openAiKey: body.openAiKey }),
                ...(body.selectedModel !== undefined && { selectedModel: body.selectedModel }),
                ...(body.theme !== undefined && { theme: body.theme }),
            },
            create: {
                userId: user.id,
                openAiKey: body.openAiKey || null,
                selectedModel: body.selectedModel || 'gpt-4o-mini',
                theme: body.theme || 'light',
            },
        });

        return NextResponse.json({
            openAiKey: settings.openAiKey || '',
            selectedModel: settings.selectedModel,
            theme: settings.theme,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
