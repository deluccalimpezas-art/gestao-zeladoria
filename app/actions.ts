'use server'

import prisma from '../src/lib/prisma'
import { revalidatePath } from 'next/cache'

// Master RH: Condominios
export async function getCondominios() {
    return await prisma.condominio.findMany({
        include: {
            funcionarios: true
        }
    })
}

export async function upsertCondominio(data: any) {
    const { id, nome, cnpj, endereco, valorContrato, inicio, termino } = data
    const result = await prisma.condominio.upsert({
        where: { id: id || '00000000-0000-0000-0000-000000000000' }, // Use a dummy UUID that won't match if no id
        update: {
            nome,
            cnpj,
            endereco,
            // mapping extra fields if needed, but keeping it simple for now as requested
        },
        create: {
            nome,
            cnpj,
            endereco
        },
    })
    revalidatePath('/')
    return result
}

export async function deleteCondominio(id: string) {
    await prisma.condominio.delete({ where: { id } })
    revalidatePath('/')
}

// Master RH: Funcionarios
export async function upsertFuncionario(data: any) {
    const { id, nome, cargo, salario, condominio } = data

    // Resolve condominioId from name if not provided
    let cId = data.condominioId;
    if (!cId && condominio) {
        const c = await prisma.condominio.findFirst({ where: { nome: condominio } });
        if (c) cId = c.id;
    }

    if (!cId) return null; // Can't save employee without a valid condo

    const result = await prisma.funcionario.upsert({
        where: { id: id || '00000000-0000-0000-0000-000000000000' },
        update: {
            nome,
            cargo,
            salarioBase: salario || 0,
            condominioId: cId
        },
        create: {
            nome,
            cargo,
            salarioBase: salario || 0,
            condominioId: cId
        },
    })
    revalidatePath('/')
    return result
}

// Financeiro
export async function getFinanceMonths() {
    return await prisma.financeMonth.findMany({
        include: {
            condominios: { include: { condominio: true } },
            funcionarios: { include: { funcionario: true } },
            impostos: true,
        },
        orderBy: [
            { ano: 'desc' },
            { mes: 'desc' }
        ]
    })
}

export async function createFinanceMonth(mes: number, ano: number) {
    const result = await prisma.financeMonth.create({
        data: { mes, ano }
    })
    revalidatePath('/')
    return result
}

export async function saveMasterRH(data: { condominios: any[], funcionarios: any[] }) {
    // This is a simplified bulk sync. For production, individual upserts or transactions are better.
    // For now, let's upsert everything provided.

    for (const condo of data.condominios) {
        await upsertCondominio(condo);
    }

    for (const func of data.funcionarios) {
        await upsertFuncionario(func);
    }

    revalidatePath('/')
}
