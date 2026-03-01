import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser();
        // Yalnızca account owner takımından birini silebilir
        if (!user || user.role !== 'owner') {
            return NextResponse.json({ error: 'Bu eylem için yetkiniz yok.' }, { status: 403 });
        }

        const { id } = await params;

        // Silinmek istenen kullanıcının, isteği yapanla aynı workspace'te olup olmadığını kontrol et
        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        if (targetUser.workspaceId !== user.workspaceId) {
            return NextResponse.json({ error: 'Bu kullanıcıyı silme yetkiniz yok.' }, { status: 403 });
        }

        if (targetUser.id === user.id) {
            return NextResponse.json({ error: 'Kendi hesabınızı bu menüden silemezsiniz.' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
