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
        const { id, nome, administradora, cnpj, endereco, valorContrato, valorVerao, cargaHoraria, valorAtivo, inicio, termino } = data;

        // Normalize CNPJ: remove non-digits and handle empty strings/nulls
        let cleanCnpj = null;
        if (cnpj && typeof cnpj === 'string') {
            const digitsOnly = cnpj.replace(/\D/g, '');
            if (digitsOnly !== '') {
                cleanCnpj = digitsOnly;
            }
        }

        const result = await prisma.condominio.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: {
                nome,
                administradora,
                cnpj: cleanCnpj,
                endereco,
                valorContrato,
                valorVerao,
                cargaHoraria,
                valorAtivo,
                inicio,
                termino
            },
            create: {
                id: data.id && data.id !== '00000000-0000-0000-0000-000000000000' && data.id.length > 10 ? data.id : undefined,
                nome,
                administradora,
                cnpj: cleanCnpj,
                endereco,
                valorContrato,
                valorVerao,
                cargaHoraria,
                valorAtivo,
                inicio,
                termino
            },
        });
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
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Erro ao salvar funcionário:", error);
        return { success: false, error: error.message };
    }
}

// Financeiro Standalone
export async function getFinanceMonths() {
    try {
        const months = await prisma.financeMonth.findMany({
            include: {
                condominios: true,
                funcionarios: true,
                impostos: true,
            },
            orderBy: [
                { created_at: 'desc' }
            ]
        });

        return months.map((m: any) => {
            const mappedCondos = m.condominios.map((mc: any) => ({
                id: mc.id,
                nome: mc.nome,
                cnpj: mc.cnpj || '',
                receitaBruta: mc.valorCobrado || 0,
                inssRetido: (mc.valorCobrado || 0) * 0.11,
                receitaLiquida: (mc.valorCobrado || 0) * 0.89,
                pagamentoFeito: mc.pago,
                valorContrato: mc.valorCobrado || 0,
                condominioId: mc.condominioId || undefined
            }));

            const mappedFuncs = m.funcionarios.map((mf: any) => ({
                id: mf.id,
                nome: mf.nome,
                condominio: mf.condominio || '',
                salario: mf.valorPago,
                horasExtras: mf.horasExtras || 0,
                totalReceber: (mf.valorPago || 0) + (mf.horasExtras || 0),
                statusClt: mf.statusClt,
                salarioBase: mf.salarioBase || 0,
                funcionarioId: mf.funcionarioId || undefined
            }));

            const totalBruto = mappedCondos.reduce((acc: number, c: any) => acc + c.receitaBruta, 0);
            const totalInss = totalBruto * 0.11;
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
    } catch (e) {
        console.error("Erro getFinanceMonths:", e);
        return [];
    }
}

export async function createEmptyFinanceMonth(nome: string) {
    try {
        const existing = await prisma.financeMonth.findFirst({ where: { nome } });
        if (existing) return { success: false, error: "Este mês já existe." };

        const newMonth = await prisma.financeMonth.create({ data: { nome } });
        revalidatePath('/');
        return { success: true, data: newMonth };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createFinanceMonth(nome: string) {
    try {
        console.log("Iniciando createFinanceMonth para:", nome);
        const existingMonth = await prisma.financeMonth.findFirst({ where: { nome } });
        if (existingMonth) return { success: false, error: "Este mês já existe." };

        const result = await prisma.$transaction(async (tx) => {
            const newMonth = await tx.financeMonth.create({ data: { nome } });
            console.log("Mês criado:", newMonth.id);

            const condos = await tx.condominio.findMany();
            console.log("Condomínios encontrados na base:", condos.length);
            if (condos.length > 0) {
                await tx.monthlyCondominio.createMany({
                    data: condos.map(c => ({
                        monthId: newMonth.id,
                        nome: c.nome,
                        cnpj: c.cnpj,
                        valorCobrado: c.valorAtivo === 'verao' ? (c.valorVerao || c.valorContrato || 0) : (c.valorContrato || 0),
                        condominioId: c.id
                    }))
                });
            }

            const funcs = await tx.funcionario.findMany({ include: { condominio: true } });
            console.log("Funcionários encontrados na base:", funcs.length);
            if (funcs.length > 0) {
                await tx.monthlyFuncionario.createMany({
                    data: funcs.map(f => ({
                        monthId: newMonth.id,
                        nome: f.nome,
                        condominio: f.condominio?.nome || '',
                        salarioBase: f.salarioBase || 0,
                        valorPago: f.salarioBase || 0,
                        statusClt: f.statusClt,
                        funcionarioId: f.id
                    }))
                });
            }

            return newMonth;
        });

        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        console.error("ERRO detalhado createFinanceMonth:", e);
        return { success: false, error: e.message };
    }
}

export async function duplicateFinanceMonth(sourceId: string, novoNome: string) {
    try {
        const existing = await prisma.financeMonth.findUnique({ where: { nome: novoNome } });
        if (existing) return { success: false, error: "Nome de mês já existe." };

        const source = await prisma.financeMonth.findUnique({
            where: { id: sourceId },
            include: { condominios: true, funcionarios: true, impostos: true }
        });
        if (!source) return { success: false, error: "Mês de origem não encontrado." };

        const newMonth = await prisma.financeMonth.create({ data: { nome: novoNome } });

        // Deep copy of all records
        await prisma.monthlyCondominio.createMany({
            data: source.condominios.map(c => ({
                monthId: newMonth.id,
                nome: c.nome,
                cnpj: c.cnpj,
                valorCobrado: c.valorCobrado,
                pago: false,
                condominioId: c.condominioId
            }))
        });

        await prisma.monthlyFuncionario.createMany({
            data: source.funcionarios.map(f => ({
                monthId: newMonth.id,
                nome: f.nome,
                condominio: f.condominio,
                salarioBase: f.salarioBase,
                valorPago: f.valorPago,
                horasExtras: f.horasExtras,
                statusClt: f.statusClt,
                funcionarioId: f.funcionarioId
            }))
        });

        await prisma.monthlyImposto.createMany({
            data: source.impostos.map(i => ({
                monthId: newMonth.id,
                nome: i.nome,
                valor: i.valor,
                pago: false
            }))
        });

        revalidatePath('/');
        return { success: true, data: newMonth };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveFinanceMonth(data: any) {
    try {
        const { id, condominios, funcionarios, impostos } = data;

        // Upsert Condos
        for (const c of condominios) {
            await prisma.monthlyCondominio.upsert({
                where: { id: c.id.length > 20 ? c.id : '00000000-0000-0000-0000-000000000000' },
                update: {
                    nome: c.nome,
                    cnpj: c.cnpj,
                    valorCobrado: c.receitaBruta || 0,
                    pago: c.pagamentoFeito || false,
                    condominioId: c.condominioId
                },
                create: {
                    id: c.id.length > 20 ? c.id : undefined,
                    monthId: id,
                    nome: c.nome,
                    cnpj: c.cnpj,
                    valorCobrado: c.receitaBruta || 0,
                    pago: c.pagamentoFeito || false,
                    condominioId: c.condominioId
                }
            });
        }

        // Upsert Funcs
        for (const f of funcionarios) {
            await prisma.monthlyFuncionario.upsert({
                where: { id: f.id.length > 20 ? f.id : '00000000-0000-0000-0000-000000000000' },
                update: {
                    nome: f.nome,
                    condominio: f.condominio,
                    valorPago: f.salario || 0,
                    horasExtras: f.horasExtras || 0,
                    statusClt: f.statusClt,
                    funcionarioId: f.funcionarioId
                },
                create: {
                    id: f.id.length > 20 ? f.id : undefined,
                    monthId: id,
                    nome: f.nome,
                    condominio: f.condominio,
                    valorPago: f.salario || 0,
                    horasExtras: f.horasExtras || 0,
                    statusClt: f.statusClt,
                    funcionarioId: f.funcionarioId
                }
            });
        }

        // Upsert Impostos
        for (const i of impostos) {
            await prisma.monthlyImposto.upsert({
                where: { id: i.id.length > 20 ? i.id : '00000000-0000-0000-0000-000000000000' },
                update: {
                    nome: i.nome,
                    valor: i.valor || 0,
                    pago: i.pago || false
                },
                create: {
                    id: i.id.length > 20 ? i.id : undefined,
                    monthId: id,
                    nome: i.nome,
                    valor: i.valor || 0,
                    pago: i.pago || false
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro saveFinanceMonth:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteFinanceMonth(monthName: string) {
    try {
        const month = await prisma.financeMonth.findUnique({
            where: { nome: monthName }
        });
        if (!month) return { success: false, error: "Mês não encontrado." };

        await prisma.financeMonth.delete({ where: { id: month.id } });
        // Os registros vinculados serão deletados pelo Cascade no schema se configurado,
        // mas como são independentes e o monthId é FK, o Cascade Delete no FinanceMonth apagará MonthlyCondominio etc.
        
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
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
        revalidatePath('/financeiro');
        revalidatePath('/rh');
        
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


