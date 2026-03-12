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
                id: data.id && data.id !== '00000000-0000-0000-0000-000000000000' && data.id.length > 10 ? data.id : undefined,
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
                id: data.id && data.id !== '00000000-0000-0000-0000-000000000000' && data.id.length > 10 ? data.id : undefined,
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
    const months = await prisma.financeMonth.findMany({
        include: {
            condominios: { include: { condominio: true } },
            funcionarios: { include: { funcionario: { include: { condominio: true } } } },
            impostos: true,
        },
        orderBy: [
            { created_at: 'desc' }
        ]
    });

    const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return months.map((m: any) => {
        const mappedCondos = m.condominios.map((mc: any) => {
            const bruto = mc.valorCobrado || 0;
            const inss = bruto * 0.11;
            return {
                id: mc.id,
                nome: mc.condominio.nome,
                cnpj: mc.condominio.cnpj || '',
                receitaBruta: bruto,
                inssRetido: inss,
                receitaLiquida: bruto - inss,
                nfFeita: false,
                nfEnviada: false,
                pagamentoFeito: mc.pago,
                valorContrato: mc.condominio.valorContrato || 0
            };
        });

        const mappedFuncs = m.funcionarios.map((mf: any) => ({
            id: mf.id,
            nome: mf.funcionario.nome,
            condominio: mf.funcionario.condominio?.nome || '',
            salario: mf.valorPago,
            horasExtras: mf.horasExtras,
            vales: 0,
            faltas: 0,
            totalReceber: mf.valorPago + mf.horasExtras,
            statusClt: mf.funcionario.statusClt as any,
        }));

        const totalBruto = mappedCondos.reduce((acc: number, c: any) => acc + c.receitaBruta, 0);
        const totalInss = mappedCondos.reduce((acc: number, c: any) => acc + c.inssRetido, 0);
        const totalLiquida = totalBruto - totalInss;
        const totalSalarios = mappedFuncs.reduce((acc: number, f: any) => acc + f.totalReceber, 0);
        const totalImpostos = m.impostos.reduce((acc: number, i: any) => acc + i.valor, 0);
        const lucroEstimado = totalLiquida - (totalSalarios + totalImpostos);

        return {
            id: m.id,
            monthName: m.nome,
            receitaBruta: totalBruto,
            inssRetido: totalInss,
            receitaLiquida: totalLiquida,
            totalSalarios,
            totalImpostos,
            lucroEstimado,
            condominios: mappedCondos,
            funcionarios: mappedFuncs,
            impostos: m.impostos.map((mi: any) => ({
                id: mi.id,
                nome: mi.nome,
                valor: mi.valor,
                pago: mi.pago
            }))
        };
    });
}

export async function createFinanceMonth(nome: string) {
    try {
        const existingMonth = await prisma.financeMonth.findFirst({
            where: { nome }
        });

        if (existingMonth) {
            return { success: false, error: "Este mês já foi criado na base de dados." };
        }

        const newMonth = await prisma.financeMonth.create({
            data: { nome }
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

export async function deleteFinanceMonth(monthName: string) {
    try {
        const month = await prisma.financeMonth.findUnique({
            where: { nome: monthName }
        });

        if (!month) {
            return { success: false, error: "Mês não encontrado." };
        }

        // Deletar registros vinculados manualmente (sem cascata no schema)
        await prisma.monthlyCondominio.deleteMany({ where: { monthId: month.id } });
        await prisma.monthlyFuncionario.deleteMany({ where: { monthId: month.id } });
        await prisma.monthlyImposto.deleteMany({ where: { monthId: month.id } });

        // Deletar o mês
        await prisma.financeMonth.delete({ where: { id: month.id } });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao deletar mês:", error);
        return { success: false, error: error.message };
    }
}

export async function duplicateFinanceMonth(sourceMonthId: string, novoNome: string) {
    try {
        const existing = await prisma.financeMonth.findUnique({ where: { nome: novoNome } });
        if (existing) return { success: false, error: "Mês destino já existe." };

        const sourceMonth = await prisma.financeMonth.findUnique({
            where: { id: sourceMonthId },
            include: { condominios: true, funcionarios: true, impostos: true }
        });
        if (!sourceMonth) return { success: false, error: "Mês origem não encontrado." };

        const newMonth = await prisma.financeMonth.create({
            data: { nome: novoNome }
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
        console.log("Iniciando saveMasterRH...");
        let errors: string[] = [];

        // 1. Processar Condomínios (Upsert)
        for (const condo of data.condominios) {
            const res = await upsertCondominio(condo);
            if (!res.success) {
                errors.push(`Condomínio "${condo.nome}": ${res.error}`);
            }
        }

        // 2. Processar Funcionários (Upsert)
        for (const func of data.funcionarios) {
            const res = await upsertFuncionario(func);
            if (!res.success) {
                errors.push(`Funcionária "${func.nome}": ${res.error}`);
            }
        }

        // 3. Processar Deleções de Funcionários
        const incomingFuncIds = data.funcionarios.map(f => f.id).filter(id => id && id.length > 10);
        const existingFuncs = await prisma.funcionario.findMany({ select: { id: true, nome: true } });
        const funcsToDelete = existingFuncs.filter(f => !incomingFuncIds.includes(f.id));
        
        for (const f of funcsToDelete) {
            try {
                // Checar se tem histórico em algum mês antes de tentar deletar
                const hasMonthlyRecord = await prisma.monthlyFuncionario.findFirst({ where: { funcionarioId: f.id } });
                if (hasMonthlyRecord) {
                    errors.push(`Não é possível excluir "${f.nome}": Existem registros financeiros vinculados em meses passados.`);
                    continue;
                }
                await prisma.funcionario.delete({ where: { id: f.id } });
                console.log(`Deletado funcionário: ${f.nome}`);
            } catch (e: any) {
                errors.push(`Erro ao excluir funcionária "${f.nome}": ${e.message}`);
            }
        }

        // 4. Processar Deleções de Condomínios
        const incomingCondoIds = data.condominios.map(c => c.id).filter(id => id && id.length > 10);
        const existingCondos = await prisma.condominio.findMany({ select: { id: true, nome: true } });
        const condosToDelete = existingCondos.filter(c => !incomingCondoIds.includes(c.id));
        
        for (const c of condosToDelete) {
            try {
                // Checar se tem histórico
                const hasMonthlyRecord = await prisma.monthlyCondominio.findFirst({ where: { condominioId: c.id } });
                if (hasMonthlyRecord) {
                    errors.push(`Não é possível excluir o condomínio "${c.nome}": Existem registros financeiros vinculados a este prédio.`);
                    continue;
                }
                await prisma.condominio.delete({ where: { id: c.id } });
                console.log(`Deletado condomínio: ${c.nome}`);
            } catch (e: any) {
                errors.push(`Erro ao excluir condomínio "${c.nome}": ${e.message}`);
            }
        }

        revalidatePath('/');
        
        if (errors.length > 0) {
            console.error("Erros durante salvamento:", errors);
            return { success: false, error: errors.join("\n") };
        }

        console.log("saveMasterRH concluído com sucesso.");
        return { success: true };
    } catch (error: any) {
        console.error("Erro crítico no saveMasterRH:", error);
        return { success: false, error: "Erro interno no servidor: " + String(error) };
    }
}

// ==========================================
// MÓDULO CRONOGRAMA & CALENDÁRIO
// ==========================================

export async function getWeeklyTasks(userId: string = "Usuário 1") {
    try {
        return await prisma.weeklyTask.findMany({
            where: { userId },
            orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }]
        });
    } catch (e) {
        console.error("Erro getWeeklyTasks:", e);
        return [];
    }
}

export async function addWeeklyTask(data: { dayOfWeek: number, title: string, time?: string, userId: string }) {
    try {
        const result = await prisma.weeklyTask.create({ data });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteWeeklyTask(id: string) {
    try {
        await prisma.weeklyTask.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getCalendarEvents(monthStart: Date, monthEnd: Date, userId: string = "Usuário 1") {
    try {
        // Busca eventos que caem nesse mes, OU eventos que sao marcados como "permanentes" (se repetem sempre)
        const events = await prisma.calendarEvent.findMany({
            where: {
                userId,
                OR: [
                    { isPermanent: true },
                    { date: { gte: monthStart, lte: monthEnd } }
                ]
            },
            orderBy: { date: 'asc' }
        });
        return events;
    } catch (e) {
        console.error("Erro getCalendarEvents:", e);
        return [];
    }
}

export async function addCalendarEvent(data: { title: string, date: Date, isPermanent: boolean, userId: string }) {
    try {
        const result = await prisma.calendarEvent.create({ data });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteCalendarEvent(id: string) {
    try {
        await prisma.calendarEvent.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleEventPermanent(id: string, currentStatus: boolean) {
    try {
        const result = await prisma.calendarEvent.update({
            where: { id },
            data: { isPermanent: !currentStatus }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


