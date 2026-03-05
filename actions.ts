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
    try {
        const { id, nome, cnpj, endereco, valorContrato, inicio, termino } = data;

        // Fix empty string unique constraint issue:
        const cleanCnpj = cnpj && cnpj.trim() !== '' ? cnpj : null;

        const result = await prisma.condominio.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: {
                nome,
                cnpj: cleanCnpj,
                endereco,
            },
            create: {
                nome,
                cnpj: cleanCnpj,
                endereco
            },
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Erro ao salvar condomínio:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCondominio(id: string) {
    try {
        await prisma.condominio.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao deletar condomínio:", error);
        return { success: false, error: error.message };
    }
}

// Master RH: Funcionarios
export async function upsertFuncionario(data: any) {
    try {
        const { id, nome, cargo, salario, condominio } = data;

        // Resolve condominioId from name if not provided
        let cId = data.condominioId;
        if (!cId && condominio) {
            const c = await prisma.condominio.findFirst({ where: { nome: condominio } });
            if (c) cId = c.id;
        }

        if (!cId) {
            console.error(`Não foi possível salvar funcionário ${nome} pois o condomínio "${condominio}" não foi encontrado no banco.`);
            return { success: false, error: "Condomínio não encontrado." };
        }

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
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Erro ao salvar funcionário:", error);
        return { success: false, error: error.message };
    }
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
    try {
        let errors = [];

        for (const condo of data.condominios) {
            const res = await upsertCondominio(condo);
            if (!res.success) errors.push(`Erro Condomínio: ${res.error}`);
        }

        for (const func of data.funcionarios) {
            const res = await upsertFuncionario(func);
            if (!res.success) errors.push(`Erro Funcionário: ${res.error}`);
        }

        revalidatePath('/');
        if (errors.length > 0) {
            return { success: false, error: errors.join(" | ") };
        }
        return { success: true };
    } catch (error: any) {
        console.error("Erro crítico no saveMasterRH:", error);
        return { success: false, error: String(error) };
    }
}
