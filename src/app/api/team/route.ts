import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

// GET: Takım üyelerini listele
export async function GET() {
    try {
        const user = await getSessionUser();
        // Sadece giriş yapmış kullanıcılar takımını görebilir.
        // Hatta sadece 'owner' görebilmeli diyebiliriz:
        if (!user || user.role !== 'owner') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        const teamMembers = await prisma.user.findMany({
            where: {
                workspaceId: user.workspaceId,
                id: { not: user.id } // Kendini listeleme opsiyonel (ya da listelesin ama silinemez olsun)
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: teamMembers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Yeni takım üyesi ekle
export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== 'owner') {
            return NextResponse.json({ error: 'Sadece çalışma alanı sahibi üye ekleyebilir.' }, { status: 403 });
        }

        const { name, email, password } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Ad, e-posta ve şifre zorunludur.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
        }

        // Email daha önce kullanılmış mı kontrol et
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Bu e-posta adresi sistemde zaten kayıtlı.' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Yeni kullanıcıyı mevcut kullanıcının çalışma alanına (workspace) ekle
        const newMember = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'member',
                workspaceId: user.workspaceId!,
                // Default settings for the new member
                settings: {
                    create: {
                        selectedModel: 'gpt-4o-mini',
                        theme: 'light',
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json({ success: true, data: newMember }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
