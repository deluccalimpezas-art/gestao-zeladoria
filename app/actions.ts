'use server'

import prisma from '../src/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFuncionarios() {
    const raw = await prisma.funcionario.findMany();
    return raw.map((f: any) => ({
        ...f,
        salario: f.salarioBase || 0,
        condominio: f.condominioNome || '',
        contratoPdf: f.contratoPdf ? f.contratoPdf.toString('base64') : null
    }));
}

// Master RH: Condominios
export async function getCondominios() {
    const raw = await (prisma.condominio as any).findMany({
        include: {
            funcionarios: true
        }
    });

    return raw.map((c: any) => ({
        ...c,
        contratoPdf: c.contratoPdf ? c.contratoPdf.toString('base64') : null,
        funcionarios: (c.funcionarios || []).map((f: any) => ({
            ...f,
            salario: f.salarioBase || 0,
            condominio: f.condominioNome || c.nome, // Use the new persisted name or fall back to relation
            contratoPdf: f.contratoPdf ? f.contratoPdf.toString('base64') : null
        }))
    }));
}

export async function upsertCondominio(data: any) {
    try {
        const { id, nome, administradora, cnpj, endereco, valorContrato, valorVerao, cargaHoraria, valorAtivo, inicio, termino, deleted, contratoPdf, contratoNome } = data;

        // Normalize CNPJ: remove non-digits and handle empty strings/nulls
        let cleanCnpj = null;
        if (cnpj && typeof cnpj === 'string') {
            const digitsOnly = cnpj.replace(/\D/g, '');
            if (digitsOnly !== '') {
                cleanCnpj = digitsOnly;
            }
        }

        const result = await (prisma.condominio as any).upsert({
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
                termino,
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined
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
                termino,
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined
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
        await (prisma.condominio as any).update({
            where: { id },
            data: { deleted: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao mover condomínio para lixeira:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCondominioPermanent(id: string) {
    try {
        await (prisma.condominio as any).delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao deletar condomínio permanentemente:", error);
        return { success: false, error: error.message };
    }
}


// Master RH: Funcionarios
export async function upsertFuncionario(data: any) {
    try {
        const { id, nome, cargo, salario, condominio, statusClt, vencimentoFerias, fimContratoExperiencia, dataAdmissao, deleted, contratoPdf, contratoNome } = data;

        // Resolve condominioId from name if not provided
        let cId = data.condominioId;
        const isSpecial = cId === 'Gerente' || cId === 'Volante' || cId === 'Sede';

        if (isSpecial) {
            cId = null;
        } else if (cId) {
            // Validate if cId is a valid UUID and exists
            const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cId);
            if (isValidUuid) {
                const exists = await (prisma.condominio as any).findUnique({ where: { id: cId } });
                if (!exists) cId = null; 
            } else {
                cId = null; // Invalid UUID format, treat as null
            }
        }

        // If cId is still null, try to resolve by name
        if (!cId && condominio) {
            const c = await (prisma.condominio as any).findFirst({ where: { nome: condominio } });
            if (c) cId = c.id;
        }

        const result = await (prisma.funcionario as any).upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: {
                nome,
                cargo,
                salarioBase: salario || 0,
                statusClt,
                vencimentoFerias,
                fimContratoExperiencia,
                dataAdmissao,
                condominioId: cId,
                condominioNome: (condominio || '').toString(),
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined
            },
            create: {
                id: (data.id && data.id !== '00000000-0000-0000-0000-000000000000' && data.id.length > 10) ? data.id : undefined,
                nome,
                cargo,
                salarioBase: salario || 0,
                statusClt,
                vencimentoFerias,
                fimContratoExperiencia,
                dataAdmissao,
                condominioId: cId,
                condominioNome: (condominio || '').toString(),
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined
            },
        });
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Erro ao salvar funcionário:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteFuncionario(id: string) {
    try {
        await prisma.funcionario.update({
            where: { id },
            data: { deleted: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao mover funcionário para demitidos:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteFuncionarioPermanent(id: string) {
    try {
        await prisma.funcionario.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao excluir funcionário permanentemente:", error);
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
                        valorCobrado: (c as any).valorAtivo === 'verao' ? ((c as any).valorVerao || (c as any).valorContrato || 0) : ((c as any).valorContrato || 0),
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
                        condominio: (f as any).condominioNome || f.condominio?.nome || '',
                        salarioBase: (f as any).salarioBase || 0,
                        valorPago: (f as any).salarioBase || 0,
                        statusClt: (f as any).statusClt,
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
            await (prisma.monthlyCondominio as any).upsert({
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
            await (prisma.monthlyFuncionario as any).upsert({
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
            await (prisma.monthlyImposto as any).upsert({
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

// ==========================================
// MÓDULO GASTOS (FLUXO DE CAIXA)
// ==========================================

export async function getGastos() {
    try {
        const raw: any[] = await (prisma as any).$queryRaw`SELECT * FROM "Gasto" ORDER BY "data" DESC`;
        return raw.map((g: any) => ({
            ...g,
            data: g.data.toISOString()
        }));
    } catch (e) {
        console.error("Erro getGastos:", e);
        return [];
    }
}

export async function upsertGasto(data: any) {
    try {
        const { id, descricao, valor, categoria, data: dataGasto, formaPagto, observacao } = data;
        const valorNum = parseFloat(valor.toString());
        const dateObj = new Date(dataGasto);
        
        if (id && id.length > 20) {
            // Update
            await (prisma as any).$executeRaw`
                UPDATE "Gasto" 
                SET "descricao" = ${descricao}, 
                    "valor" = ${valorNum}, 
                    "categoria" = ${categoria}, 
                    "data" = ${dateObj}, 
                    "formaPagto" = ${formaPagto}, 
                    "observacao" = ${observacao},
                    "updatedAt" = NOW()
                WHERE "id" = ${id}
            `;
            return { success: true };
        } else {
            // Create
            const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
            await (prisma as any).$executeRaw`
                INSERT INTO "Gasto" ("id", "descricao", "valor", "categoria", "data", "formaPagto", "observacao", "createdAt", "updatedAt")
                VALUES (${newId}, ${descricao}, ${valorNum}, ${categoria}, ${dateObj}, ${formaPagto}, ${observacao}, NOW(), NOW())
            `;
            revalidatePath('/');
            return { success: true };
        }
    } catch (e: any) {
        console.error("Erro upsertGasto:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteGasto(id: string) {
    try {
        await (prisma as any).$executeRaw`DELETE FROM "Gasto" WHERE "id" = ${id}`;
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro deleteGasto:", e);
        return { success: false, error: e.message };
    }
}



// ==========================================
// MÓDULO GESTÃO FINANCEIRA PESSOAL
// ==========================================

export async function getPersonalFinanceData(month: number, year: number) {
    try {
        // Tenta encontrar ou criar o mês
        let personalMonth = await (prisma as any).personalFinanceMonth.findFirst({
            where: { month, year },
            include: {
                fixedExpenses: { orderBy: { name: 'asc' } },
                cardExpenses: { orderBy: { description: 'asc' } }
            }
        });

        if (!personalMonth) {
            const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            personalMonth = await (prisma as any).personalFinanceMonth.create({
                data: {
                    month,
                    year,
                    monthName: `${months[month - 1]} ${year}`
                },
                include: {
                    fixedExpenses: true,
                    cardExpenses: {
                        include: { card: true }
                    }
                }
            });
        }

        return { success: true, data: personalMonth };
    } catch (e: any) {
        console.error("Erro getPersonalFinanceData:", e);
        return { success: false, error: e.message };
    }
}

export async function upsertPersonalFixedExpense(data: any) {
    try {
        const { id, name, value, dueDate, paid, monthId } = data;
        const result = await (prisma as any).personalFixedExpense.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { name, value, dueDate, paid },
            create: { name, value, dueDate, paid, monthId }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function upsertPersonalCreditCardExpense(data: any) {
    try {
        const { id, cardId, cardName, description, value, isInstallment, currentInstallment, totalInstallments, installmentGroupId, category, paid, monthId } = data;
        const result = await (prisma as any).personalCreditCardExpense.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { cardId, cardName, description, value, isInstallment, currentInstallment, totalInstallments, installmentGroupId, category, paid },
            create: { cardId, cardName, description, value, isInstallment, currentInstallment, totalInstallments, installmentGroupId, category, paid, monthId }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addPersonalRecurringExpense(data: any) {
    try {
        const { cardId, cardName, description, value, totalInstallments, month, year, category } = data;
        const installmentGroupId = crypto.randomUUID();
        
        const results = [];
        for (let i = 0; i < totalInstallments; i++) {
            let targetMonth = month + i;
            let targetYear = year;
            
            while (targetMonth > 12) {
                targetMonth -= 12;
                targetYear += 1;
            }

            // Garante que o mês existe
            let pMonth = await (prisma as any).personalFinanceMonth.findFirst({
                where: { month: targetMonth, year: targetYear }
            });

            if (!pMonth) {
                const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                pMonth = await (prisma as any).personalFinanceMonth.create({
                    data: {
                        month: targetMonth,
                        year: targetYear,
                        monthName: `${months[targetMonth - 1]} ${targetYear}`
                    }
                });
            }

            const exp = await (prisma as any).personalCreditCardExpense.create({
                data: {
                    cardId,
                    cardName: cardName || 'Principal',
                    description: `${description} - ${i + 1}/${totalInstallments} parcelas`,
                    value,
                    isInstallment: true,
                    currentInstallment: i + 1,
                    totalInstallments,
                    installmentGroupId,
                    category: category || 'Outros',
                    monthId: pMonth.id
                }
            });
            results.push(exp);
        }

        revalidatePath('/');
        return { success: true, data: results };
    } catch (e: any) {
        console.error("Erro addPersonalRecurringExpense:", e);
        return { success: false, error: e.message };
    }
}

export async function deletePersonalFixedExpense(id: string) {
    try {
        await (prisma as any).personalFixedExpense.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deletePersonalCreditCardExpense(id: string, deleteAllGroup: boolean = false) {
    try {
        if (deleteAllGroup) {
            const exp = await (prisma as any).personalCreditCardExpense.findUnique({ where: { id } });
            if (exp?.installmentGroupId) {
                await (prisma as any).personalCreditCardExpense.deleteMany({
                    where: { installmentGroupId: exp.installmentGroupId }
                });
            } else {
                await (prisma as any).personalCreditCardExpense.delete({ where: { id } });
            }
        } else {
            await (prisma as any).personalCreditCardExpense.delete({ where: { id } });
        }
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
export async function getPersonalCards() {
    try {
        const cards = await (prisma as any).personalCreditCard.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: cards };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function upsertPersonalCard(data: any) {
    try {
        const { id, name, bank, color } = data;
        const result = await (prisma as any).personalCreditCard.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { name, bank, color },
            create: { name, bank, color }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deletePersonalCard(id: string) {
    try {
        await (prisma as any).personalCreditCard.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function replicatePersonalFixedExpense(id: string, currentMonth: number, currentYear: number) {
    try {
        const item = await (prisma as any).personalFixedExpense.findUnique({ where: { id } });
        if (!item) return { success: false, error: "Item não encontrado" };

        const results = [];
        for (let i = 1; i <= 12; i++) {
            let targetMonth = currentMonth + i;
            let targetYear = currentYear;
            while (targetMonth > 12) {
                targetMonth -= 12;
                targetYear += 1;
            }

            let pMonth = await (prisma as any).personalFinanceMonth.findFirst({
                where: { month: targetMonth, year: targetYear }
            });

            if (!pMonth) {
                const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                pMonth = await (prisma as any).personalFinanceMonth.create({
                    data: {
                        month: targetMonth,
                        year: targetYear,
                        monthName: `${monthsNames[targetMonth - 1]} ${targetYear}`
                    }
                });
            }

            const newItem = await (prisma as any).personalFixedExpense.create({
                data: {
                    name: item.name,
                    value: item.value,
                    dueDate: item.dueDate,
                    paid: false,
                    monthId: pMonth.id
                }
            });
            results.push(newItem);
        }
        revalidatePath('/');
        return { success: true, count: results.length };
    } catch (e: any) {
        console.error("Erro replicatePersonalFixedExpense:", e);
        return { success: false, error: e.message };
    }
}
