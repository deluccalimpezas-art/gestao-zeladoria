'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getWorkspacePages() {
    try {
        const pages = await (prisma as any).workspacePage.findMany({
            where: { isDeleted: false, parentId: null },
            include: {
                subPages: {
                    where: { isDeleted: false },
                    include: { subPages: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, data: pages };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPageWithBlocks(pageId: string) {
    try {
        const page = await (prisma as any).workspacePage.findUnique({
            where: { id: pageId },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
                },
                subPages: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        return { success: true, data: page };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createWorkspacePage(title: string = "Sem título", parentId?: string) {
    try {
        const page = await (prisma as any).workspacePage.create({
            data: {
                title,
                parentId,
                blocks: {
                    create: [
                        { type: 'text', content: { text: '' }, order: 0 }
                    ]
                }
            }
        });
        revalidatePath('/');
        return { success: true, data: page };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateWorkspacePage(id: string, data: { title?: string, icon?: string, cover?: string }) {
    try {
        const page = await (prisma as any).workspacePage.update({
            where: { id },
            data
        });
        revalidatePath('/');
        return { success: true, data: page };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteWorkspacePage(id: string) {
    try {
        await (prisma as any).workspacePage.update({
            where: { id },
            data: { isDeleted: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveWorkspaceBlocks(pageId: string, blocks: any[]) {
    try {
        // Simple strategy: delete existing and recreate or update
        // For MVP, we'll use a transaction to clear and set
        await prisma.$transaction([
            (prisma as any).workspaceBlock.deleteMany({ where: { pageId } }),
            (prisma as any).workspaceBlock.createMany({
                data: blocks.map((b, idx) => ({
                    id: b.id || undefined,
                    type: b.type,
                    content: b.content,
                    order: idx,
                    pageId: pageId
                }))
            })
        ]);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
