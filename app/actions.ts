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
                valorContrato,
                inicio,
                termino
            },
            create: {
                nome,
                cnpj: cleanCnpj,
                endereco,
                valorContrato,
                inicio,
                termino
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
        const { id, nome, cargo, salario, condominio, statusClt, vencimentoFerias, fimContratoExperiencia, dataAdmissao } = data;

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
                statusClt,
                vencimentoFerias,
                fimContratoExperiencia,
                dataAdmissao,
                condominioId: cId
            },
            create: {
                nome,
                cargo,
                salarioBase: salario || 0,
                statusClt,
                vencimentoFerias,
                fimContratoExperiencia,
                dataAdmissao,
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
    try {
        const newMonth = await prisma.financeMonth.create({
            data: { mes, ano }
        });

        const condominios = await prisma.condominio.findMany();
        const funcionarios = await prisma.funcionario.findMany();

        if (condominios.length > 0) {
            await prisma.monthlyCondominio.createMany({
                data: condominios.map(c => ({
                    monthId: newMonth.id,
                    condominioId: c.id,
                    valorCobrado: c.valorContrato || 0,
                    pago: false
                }))
            });
        }

        if (funcionarios.length > 0) {
            await prisma.monthlyFuncionario.createMany({
                data: funcionarios.map(f => ({
                    monthId: newMonth.id,
                    funcionarioId: f.id,
                    valorPago: f.salarioBase || 0,
                    horasExtras: 0
                }))
            });
        }

        revalidatePath('/');
        return { success: true, data: newMonth };
    } catch (error: any) {
        console.error("Erro ao criar mês:", error);
        return { success: false, error: error.message };
    }
}

export async function duplicateFinanceMonth(sourceMonthId: string, novoMes: number, novoAno: number) {
    try {
        const existing = await prisma.financeMonth.findUnique({ where: { mes_ano: { mes: novoMes, ano: novoAno } } });
        if (existing) return { success: false, error: "Mês destino já existe." };

        const sourceMonth = await prisma.financeMonth.findUnique({
            where: { id: sourceMonthId },
            include: { condominios: true, funcionarios: true, impostos: true }
        });
        if (!sourceMonth) return { success: false, error: "Mês origem não encontrado." };

        const newMonth = await prisma.financeMonth.create({
            data: { mes: novoMes, ano: novoAno }
        });

        if (sourceMonth.condominios.length > 0) {
            await prisma.monthlyCondominio.createMany({
                data: sourceMonth.condominios.map(c => ({
                    monthId: newMonth.id,
                    condominioId: c.condominioId,
                    valorCobrado: c.valorCobrado,
                    pago: false
                }))
            });
        }

        if (sourceMonth.funcionarios.length > 0) {
            await prisma.monthlyFuncionario.createMany({
                data: sourceMonth.funcionarios.map(f => ({
                    monthId: newMonth.id,
                    funcionarioId: f.funcionarioId,
                    valorPago: f.valorPago,
                    horasExtras: f.horasExtras
                }))
            });
        }

        if (sourceMonth.impostos.length > 0) {
            await prisma.monthlyImposto.createMany({
                data: sourceMonth.impostos.map(i => ({
                    monthId: newMonth.id,
                    nome: i.nome,
                    valor: i.valor,
                    pago: false
                }))
            });
        }

        revalidatePath('/');
        return { success: true, data: newMonth };
    } catch (error: any) {
        console.error("Erro ao duplicar mês:", error);
        return { success: false, error: error.message };
    }
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
