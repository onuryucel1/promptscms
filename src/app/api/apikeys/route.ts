import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, key: true, createdAt: true, lastUsedAt: true }
        });

        // Obfuscate the keys returning to the client for display (except right after creation, see POST)
        const safeKeys = apiKeys.map(k => ({
            ...k,
            key: `pcms-${k.key.substring(0, 4)}...${k.key.substring(k.key.length - 4)}`
        }));

        return NextResponse.json(safeKeys);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        // Generate a secure random API key
        // Format: pcms_ + 32 hex chars
        const rawKey = `pcms_${crypto.randomBytes(24).toString('hex')}`;

        const newKey = await prisma.apiKey.create({
            data: {
                name,
                key: rawKey,
                userId: user.id
            }
        });

        // Only return the FULL rawKey ONCE upon creation
        return NextResponse.json(newKey, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
