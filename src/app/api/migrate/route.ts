import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// POST /api/migrate — Migrate localStorage data to database
export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await req.json();
        const { prompts, settings } = body;

        let importedCount = 0;

        // Import prompts
        if (Array.isArray(prompts)) {
            for (const p of prompts) {
                await prisma.prompt.create({
                    data: {
                        title: p.title,
                        content: p.content,
                        systemPrompt: p.systemPrompt || null,
                        tags: JSON.stringify(p.tags || []),
                        userId: user.id,
                        versions: {
                            create: (p.versions || []).map((v: any) => ({
                                versionName: v.versionName,
                                title: v.title,
                                content: v.content,
                            })),
                        },
                    },
                });
                importedCount++;
            }
        }

        // Import settings
        if (settings) {
            await prisma.userSettings.upsert({
                where: { userId: user.id },
                update: {
                    openAiKey: settings.openAiKey || null,
                    selectedModel: settings.selectedModel || 'gpt-4o-mini',
                    theme: settings.theme || 'light',
                },
                create: {
                    userId: user.id,
                    openAiKey: settings.openAiKey || null,
                    selectedModel: settings.selectedModel || 'gpt-4o-mini',
                    theme: settings.theme || 'light',
                },
            });
        }

        return NextResponse.json({ success: true, importedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
