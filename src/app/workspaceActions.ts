'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getWorkspacePages() {
    try {
        const pages = await prisma.workspacePage.findMany({
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
        const page = await prisma.workspacePage.findUnique({
            where: { id: pageId },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
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
        const page = await prisma.workspacePage.create({
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
        const page = await prisma.workspacePage.update({
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
        await prisma.workspacePage.update({
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
            prisma.workspaceBlock.deleteMany({ where: { pageId } }),
            prisma.workspaceBlock.createMany({
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
