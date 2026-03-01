import { prisma } from './src/lib/db';

async function main() {
    console.log('--- Users ---');
    const users = await prisma.user.findMany({ select: { name: true, email: true, role: true, workspaceId: true } });
    console.dir(users, { depth: null });

    console.log('--- Prompts ---');
    const prompts = await prisma.prompt.findMany({ select: { title: true, workspaceId: true } });
    console.dir(prompts, { depth: null });

    console.log('--- Documents ---');
    const docs = await prisma.document.findMany({ select: { title: true, workspaceId: true } });
    console.dir(docs, { depth: null });

    console.log('--- Workflows ---');
    const flows = await prisma.workflow.findMany({ select: { name: true, workspaceId: true } });
    console.dir(flows, { depth: null });

    console.log('--- Workspaces ---');
    const workspaces = await prisma.workspace.findMany();
    console.dir(workspaces, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
