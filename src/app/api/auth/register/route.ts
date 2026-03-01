import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Ad, email ve şifre zorunludur.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Bu email zaten kullanılıyor.' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Kullanıcı oluşturulurken aynı zamanda ona ait bir Workspace aç ve ikisini bağla
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'owner',
                workspace: {
                    create: {
                        name: `${name.split(' ')[0]}'s Workspace`
                    }
                },
                settings: {
                    create: {
                        selectedModel: 'gpt-4o-mini',
                        theme: 'light',
                    },
                },
            },
        });

        const token = await createToken(user.id);
        await setAuthCookie(token);

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
