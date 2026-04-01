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
        console.log(`Upserting condominio: ${data.nome} (ID: ${data.id}) - Obs: ${data.observacao ? 'Sim' : 'Não'}`);
        const { id, nome, administradora, cnpj, endereco, valorContrato, cargaHoraria, inicio, termino, deleted, contratoPdf, contratoNome, observacao } = data;

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
                cargaHoraria,
                inicio,
                termino,
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined,
                observacao
            },
            create: {
                id: data.id && data.id !== '00000000-0000-0000-0000-000000000000' && data.id.length > 10 ? data.id : undefined,
                nome,
                administradora,
                cnpj: cleanCnpj,
                endereco,
                valorContrato,
                cargaHoraria,
                inicio,
                termino,
                deleted: deleted ?? false,
                contratoPdf: contratoPdf ? Buffer.from(contratoPdf.split(',')[1] || contratoPdf, 'base64') : undefined,
                contratoNome: contratoNome || undefined,
                observacao
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
        const { id, nome, cargo, salario, condominio, statusClt, vencimentoFerias, fimContratoExperiencia, dataAdmissao, deleted, contratoPdf, contratoNome, observacao } = data;

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
                contratoNome: contratoNome || undefined,
                observacao
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
                contratoNome: contratoNome || undefined,
                observacao
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
        const months = await (prisma as any).financeMonth.findMany({
            include: {
                condominios: true,
                funcionarios: true,
                impostos: true,
                gastos: true,
            },
            orderBy: [
                { order: 'asc' },
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
                condominioId: mc.condominioId || undefined,
                observacao: mc.observacao || ''
            }));

            const mappedFuncs = m.funcionarios.map((mf: any) => ({
                id: mf.id,
                nome: mf.nome,
                condominio: mf.condominio || '',
                salario: mf.valorPago,
                horasExtras: mf.horasExtras || 0,
                totalReceber: (mf.valorPago || 0) + (mf.horasExtras || 0) + (mf.rescisaoFerias || 0),
                statusClt: mf.statusClt,
                salarioBase: mf.salarioBase || 0,
                rescisaoFerias: mf.rescisaoFerias || 0,
                funcionarioId: mf.funcionarioId || undefined,
                observacao: mf.observacao || ''
            }));

            const mappedGastos = m.gastos.map((mg: any) => ({
                id: mg.id,
                descricao: mg.descricao,
                valor: mg.valor,
                pago: mg.pago,
                categoria: mg.categoria || 'Outros',
                data: mg.data || ''
            }));

            const totalBruto = mappedCondos.reduce((acc: number, c: any) => acc + c.receitaBruta, 0);
            const totalInss = totalBruto * 0.11;
            const totalLiquida = totalBruto - totalInss;
            const totalSalarios = mappedFuncs.reduce((acc: number, f: any) => acc + f.totalReceber, 0);
            const totalImpostos = m.impostos.reduce((acc: number, i: any) => acc + i.valor, 0);
            const totalGastos = mappedGastos.reduce((acc: number, g: any) => acc + g.valor, 0);
            const lucroEstimado = totalLiquida - (totalSalarios + totalImpostos + totalGastos);

            return {
                id: m.id,
                monthName: m.nome,
                receitaBruta: totalBruto,
                inssRetido: totalInss,
                receitaLiquida: totalLiquida,
                totalSalarios,
                totalImpostos,
                totalGastos,
                lucroEstimado,
                condominios: mappedCondos,
                funcionarios: mappedFuncs,
                impostos: m.impostos,
                gastos: mappedGastos
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

            const condos = await tx.condominio.findMany({ where: { deleted: false } });
            console.log("Condomínios encontrados na base:", condos.length);
            if (condos.length > 0) {
                await tx.monthlyCondominio.createMany({
                    data: condos.map(c => ({
                        monthId: newMonth.id,
                        nome: c.nome,
                        cnpj: c.cnpj,
                        administradora: c.administradora,
                        valorCobrado: c.valorContrato || 0,
                        condominioId: c.id,
                        observacao: c.observacao || ''
                    }))
                });
            }

            const funcs = await tx.funcionario.findMany({ 
                where: { deleted: false },
                include: { condominio: true } 
            });
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
                        rescisaoFerias: 0,
                        funcionarioId: f.id,
                        observacao: (f as any).observacao || ''
                    }))
                });
            }

            const rhImpostos = await (tx as any).rHImposto.findMany();
            if (rhImpostos.length > 0) {
                await tx.monthlyImposto.createMany({
                    data: rhImpostos.map((i: any) => ({
                        monthId: newMonth.id,
                        nome: i.nome,
                        valor: i.valor || 0,
                        pago: false,
                        observacao: i.observacao || ''
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

        const source = await (prisma as any).financeMonth.findUnique({
            where: { id: sourceId },
            include: { condominios: true, funcionarios: true, impostos: true, gastos: true }
        });
        if (!source) return { success: false, error: "Mês de origem não encontrado." };

        const newMonth = await prisma.financeMonth.create({ data: { nome: novoNome } });

        // Deep copy of all records
        if (source.condominios.length > 0) {
            await prisma.monthlyCondominio.createMany({
                data: source.condominios.map((c: any) => ({
                    monthId: newMonth.id,
                    nome: c.nome,
                    cnpj: c.cnpj,
                    administradora: c.administradora,
                    valorCobrado: c.valorCobrado,
                    pago: false,
                    condominioId: c.condominioId,
                    observacao: c.observacao
                }))
            });
        }

        if (source.funcionarios.length > 0) {
            await prisma.monthlyFuncionario.createMany({
                data: source.funcionarios.map((f: any) => ({
                    monthId: newMonth.id,
                    nome: f.nome,
                    condominio: f.condominio,
                    salarioBase: f.salarioBase,
                    valorPago: f.valorPago,
                    horasExtras: f.horasExtras,
                    statusClt: f.statusClt,
                    funcionarioId: f.funcionarioId,
                    observacao: f.observacao
                }))
            });
        }

        if (source.impostos.length > 0) {
            await prisma.monthlyImposto.createMany({
                data: source.impostos.map((i: any) => ({
                    monthId: newMonth.id,
                    nome: i.nome,
                    valor: i.valor,
                    pago: false,
                    observacao: i.observacao
                }))
            });
        }

        if (source.gastos.length > 0) {
            await (prisma as any).monthlyGasto.createMany({
                data: source.gastos.map((g: any) => ({
                    monthId: newMonth.id,
                    descricao: g.descricao,
                    valor: g.valor,
                    pago: false,
                    categoria: g.categoria,
                    data: g.data
                }))
            });
        }

        revalidatePath('/');
        return { success: true, data: newMonth };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveFinanceMonth(data: any) {
    try {
        const { id, condominios, funcionarios, impostos, gastos } = data;

        // Upsert Condos
        if (condominios && Array.isArray(condominios)) {
            const incomingIds = condominios.map((c: any) => c.id).filter((id: string) => id && id.length > 20);
            await (prisma.monthlyCondominio as any).deleteMany({
                where: {
                    monthId: id,
                    id: { notIn: incomingIds }
                }
            });

            for (const c of condominios) {
                await (prisma.monthlyCondominio as any).upsert({
                    where: { id: c.id.length > 20 ? c.id : '00000000-0000-0000-0000-000000000000' },
                    update: {
                        nome: c.nome,
                        cnpj: c.cnpj,
                        administradora: c.administradora,
                        valorCobrado: c.receitaBruta || 0,
                        pago: c.pagamentoFeito || false,
                        condominioId: c.condominioId,
                        observacao: c.observacao
                    },
                    create: {
                        id: c.id.length > 20 ? c.id : undefined,
                        monthId: id,
                        nome: c.nome,
                        cnpj: c.cnpj,
                        administradora: c.administradora,
                        valorCobrado: c.receitaBruta || 0,
                        pago: c.pagamentoFeito || false,
                        condominioId: c.condominioId,
                        observacao: c.observacao
                    }
                });
            }
        }

        // Upsert Funcs
        if (funcionarios && Array.isArray(funcionarios)) {
            const incomingIds = funcionarios.map((f: any) => f.id).filter((id: string) => id && id.length > 20);
            await (prisma.monthlyFuncionario as any).deleteMany({
                where: {
                    monthId: id,
                    id: { notIn: incomingIds }
                }
            });

            for (const f of funcionarios) {
                await (prisma.monthlyFuncionario as any).upsert({
                    where: { id: f.id.length > 20 ? f.id : '00000000-0000-0000-0000-000000000000' },
                    update: {
                        nome: f.nome,
                        condominio: f.condominio,
                        valorPago: f.salario || 0,
                        horasExtras: f.horasExtras || 0,
                        rescisaoFerias: f.rescisaoFerias || 0,
                        statusClt: f.statusClt,
                        funcionarioId: f.funcionarioId,
                        observacao: f.observacao
                    },
                    create: {
                        id: f.id.length > 20 ? f.id : undefined,
                        monthId: id,
                        nome: f.nome,
                        condominio: f.condominio,
                        valorPago: f.salario || 0,
                        horasExtras: f.horasExtras || 0,
                        rescisaoFerias: f.rescisaoFerias || 0,
                        statusClt: f.statusClt,
                        funcionarioId: f.funcionarioId,
                        observacao: f.observacao
                    }
                });
            }
        }

        // Upsert Impostos
        if (impostos && Array.isArray(impostos)) {
            const incomingIds = impostos.map((i: any) => i.id).filter((id: string) => id && id.length > 20);
            await (prisma.monthlyImposto as any).deleteMany({
                where: {
                    monthId: id,
                    id: { notIn: incomingIds }
                }
            });

            for (const i of impostos) {
                await (prisma.monthlyImposto as any).upsert({
                    where: { id: i.id.length > 20 ? i.id : '00000000-0000-0000-0000-000000000000' },
                    update: {
                        nome: i.nome,
                        valor: i.valor || 0,
                        pago: i.pago || false,
                        observacao: i.observacao
                    },
                    create: {
                        id: i.id.length > 20 ? i.id : undefined,
                        monthId: id,
                        nome: i.nome,
                        valor: i.valor || 0,
                        pago: i.pago || false,
                        observacao: i.observacao
                    }
                });
            }
        }

        // Upsert Gastos
        if (gastos && Array.isArray(gastos)) {
            // Deletar os que não vieram
            const incomingGastoIds = gastos.map((g: any) => g.id).filter((id: string) => id && id.length > 20);
            await (prisma as any).monthlyGasto.deleteMany({
                where: {
                    monthId: id,
                    id: { notIn: incomingGastoIds }
                }
            });

            for (const g of gastos) {
                await (prisma as any).monthlyGasto.upsert({
                    where: { id: (g.id && g.id.length > 20) ? g.id : '00000000-0000-0000-0000-000000000000' },
                    update: {
                        descricao: g.descricao,
                        valor: g.valor || 0,
                        pago: g.pago || false,
                        categoria: g.categoria || 'Outros',
                        data: g.data || ''
                    },
                    create: {
                        id: (g.id && g.id.length > 20) ? g.id : undefined,
                        monthId: id,
                        descricao: g.descricao,
                        valor: g.valor || 0,
                        pago: g.pago || false,
                        categoria: g.categoria || 'Outros',
                        data: g.data || ''
                    }
                });
            }
        }

        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro saveFinanceMonth:", e);
        return { success: false, error: e.message };
    }
}

// Granular updates for Generators
export async function getMonthlyFinanceByMonth(monthName: string) {
    try {
        const month = await prisma.financeMonth.findUnique({
            where: { nome: monthName },
            include: {
                condominios: {
                    include: {
                        condominio: true
                    }
                },
                funcionarios: true
            }
        });

        if (month) {
            // Flatten administradora from relation if the field is null (legacy data)
            const mappedCondos = month.condominios.map((mc: any) => ({
                ...mc,
                administradora: mc.administradora || mc.condominio?.administradora || null
            }));
            return { success: true, data: { ...month, condominios: mappedCondos } };
        }

        return { success: true, data: month };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateMonthlyCondominio(id: string, data: { valorCobrado?: number, observacao?: string }) {
    try {
        const result = await (prisma as any).monthlyCondominio.update({
            where: { id },
            data: {
                valorCobrado: data.valorCobrado,
                observacao: data.observacao
            }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateMonthlyFuncionario(id: string, data: { valorPago?: number, horasExtras?: number, rescisaoFerias?: number, observacao?: string }) {
    try {
        const result = await (prisma as any).monthlyFuncionario.update({
            where: { id },
            data: {
                valorPago: data.valorPago,
                horasExtras: data.horasExtras,
                rescisaoFerias: data.rescisaoFerias,
                observacao: data.observacao
            }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
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

export async function updateFinanceMonthsOrder(orderedIds: string[]) {
    try {
        console.log("Atualizando ordem dos meses:", orderedIds);
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.financeMonth.update({
                    where: { id },
                    data: { order: index }
                })
            )
        );
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro updateFinanceMonthsOrder:", e);
        return { success: false, error: e.message };
    }
}

// --- PÓS-OBRAS ---

export async function getPosObras() {
    try {
        const obras = await (prisma as any).posObra.findMany({
            include: { gastos: true },
            orderBy: { created_at: 'desc' }
        });
        return obras;
    } catch (e) {
        console.error("Erro getPosObras:", e);
        return [];
    }
}

export async function savePosObra(data: any) {
    try {
        const { id, nome, cliente, data: dataObra, valor, status, gastos } = data;

        const obra = await (prisma as any).posObra.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { nome, cliente, data: dataObra, valor: Number(valor) || 0, status },
            create: { nome, cliente, data: dataObra, valor: Number(valor) || 0, status }
        });

        // Sincronizar Gastos
        if (gastos) {
            const incomingGastoIds = gastos.map((g: any) => g.id).filter((id: any) => id && id.length > 20);
            await (prisma as any).posObraGasto.deleteMany({
                where: {
                    posObraId: obra.id,
                    id: { notIn: incomingGastoIds }
                }
            });

            for (const g of gastos) {
                await (prisma as any).posObraGasto.upsert({
                    where: { id: (g.id && g.id.length > 20) ? g.id : '00000000-0000-0000-0000-000000000000' },
                    update: {
                        descricao: g.descricao,
                        valor: g.valor || 0,
                        tipo: g.tipo,
                        data: g.data
                    },
                    create: {
                        posObraId: obra.id,
                        descricao: g.descricao,
                        valor: g.valor || 0,
                        tipo: g.tipo,
                        data: g.data
                    }
                });
            }
        }

        revalidatePath('/');
        return { success: true, id: obra.id };
    } catch (e: any) {
        console.error("Erro savePosObra:", e);
        return { success: false, error: e.message };
    }
}

export async function deletePosObra(id: string) {
    try {
        await (prisma as any).posObra.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro deletePosObra:", e);
        return { success: false, error: e.message };
    }
}

export async function saveMasterRH(data: { condominios: any[], funcionarios: any[], impostos?: any[] }) {
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

        // 5. Processar Impostos (Novo)
        if (data.impostos && Array.isArray(data.impostos)) {
            for (const imp of data.impostos) {
                await upsertRHImposto(imp);
            }
            // Deleção de impostos que não vieram
            const incomingImpIds = data.impostos.map(i => i.id).filter(id => id && id.length > 20);
            await (prisma as any).rHImposto.deleteMany({
                where: {
                    id: { notIn: incomingImpIds }
                }
            });
        }
        
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

export async function propagateAllFixedExpenses(monthId: string, currentMonth: number, currentYear: number) {
    try {
        const items = await (prisma as any).personalFixedExpense.findMany({ where: { monthId } });
        if (items.length === 0) return { success: false, error: "Nenhuma conta encontrada neste mês" };

        let createdCount = 0;
        for (const item of items) {
            // Reutiliza a lógica unitária para cada item
            const res = await replicatePersonalFixedExpense(item.id, currentMonth, currentYear);
            if (res.success) createdCount++; 
        }
        
        revalidatePath('/');
        return { success: true, count: createdCount };
    } catch (e: any) {
        console.error("Erro propagateAllFixedExpenses:", e);
        return { success: false, error: e.message };
    }
}

// ==========================================
// MÓDULO AFAZERES (POST-ITS)
// ==========================================

export async function getTaskTodos() {
    try {
        return await prisma.taskTodo.findMany({
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        console.error("Erro getTaskTodos:", e);
        return [];
    }
}

export async function upsertTaskTodo(data: any) {
    try {
        const { id, title, description, completed } = data;
        const result = await prisma.taskTodo.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { title, description, completed },
            create: { title, description, completed: completed || false }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Erro upsertTaskTodo:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteTaskTodo(id: string) {
    try {
        await prisma.taskTodo.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro deleteTaskTodo:", e);
        return { success: false, error: e.message };
    }
}

// --- NOTAS ---

export async function getNotes() {
    try {
        return await (prisma as any).note.findMany({
            orderBy: { updatedAt: 'desc' }
        });
    } catch (e) {
        console.error("Erro getNotes:", e);
        return [];
    }
}

export async function saveNote(data: { id?: string, title: string, content?: string, color?: string }) {
    try {
        const { id, title, content, color } = data;
        const result = await (prisma as any).note.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { title, content, color, updatedAt: new Date() },
            create: { title, content, color }
        });
        revalidatePath('/');
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Erro saveNote:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteNote(id: string) {
    try {
        await (prisma as any).note.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro deleteNote:", e);
        return { success: false, error: e.message };
    }
}

// --- RH IMPOSTOS (BASE) ---

export async function getRHImpostos() {
    try {
        return await (prisma as any).rHImposto.findMany({
            orderBy: { nome: 'asc' }
        });
    } catch (e) {
        console.error("Erro getRHImpostos:", e);
        return [];
    }
}

export async function upsertRHImposto(data: any) {
    try {
        const { id, nome, valor, vencimento, observacao } = data;
        const validId = (id && id !== '00000000-0000-0000-0000-000000000000' && id.length > 10) ? id : undefined;
        
        const result = await (prisma as any).rHImposto.upsert({
            where: { id: id || '00000000-0000-0000-0000-000000000000' },
            update: { nome, valor: parseFloat(valor) || 0, vencimento, observacao },
            create: { 
                id: validId,
                nome, 
                valor: parseFloat(valor) || 0, 
                vencimento,
                observacao
            }
        });
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Erro upsertRHImposto:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteRHImposto(id: string) {
    try {
        await (prisma as any).rHImposto.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("Erro deleteRHImposto:", e);
        return { success: false, error: e.message };
    }
}

