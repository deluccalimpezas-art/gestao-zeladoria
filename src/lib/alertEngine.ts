import type { Alert } from '../types';
import type { FuncionarioCSV } from '../models';
import type { CondominioData, FuncionarioData } from '../modelsFinance';

// Configurações de tempo para gerar alertas
const DIAS_AVISO_FERIAS = 30;
const DIAS_AVISO_CONTRATO = 15;

/**
 * Calcula a diferença real em dias entre hoje e uma data futura
 */
function calcularDiasRestantes(dataAlvo: string): number {
    if (!dataAlvo) return -1;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let alvo: Date;

    // Suporte para DD/MM/YYYY
    if (dataAlvo.includes('/')) {
        const [dia, mes, ano] = dataAlvo.split('/');
        alvo = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    } else {
        // Suporte para YYYY-MM-DD
        const [ano, mes, dia] = dataAlvo.split('-');
        alvo = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }

    if (isNaN(alvo.getTime())) return -1;

    const diffTime = alvo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Motor de Regras: transforma uma lista de Funcionarios num array de Alertas
 */
export function gerarAlertasDashboard(funcionarios: FuncionarioCSV[]): Alert[] {
    const alertas: Alert[] = [];

    funcionarios.forEach((func) => {
        // 1. Regra de Férias
        if (func.VencimentoFerias) {
            const diasRestantes = calcularDiasRestantes(func.VencimentoFerias);

            // Só gera o alerta se faltar menos ou igual ao limite de dias previstos, 
            // e também ignora se já tiver passado a data (diasRestantes < 0) 
            // dependendo de como quer gerir os "vencidos". Vamos colocar >= 0 para pegar só os que vão vencer
            if (diasRestantes <= DIAS_AVISO_FERIAS && diasRestantes >= 0) {
                alertas.push({
                    id: `ferias-${func.Nome.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                    type: 'ferias',
                    category: 'funcionario',
                    title: `${func.Nome} (${func.Cargo})`,
                    subtitle: diasRestantes === 0 ? 'Vence HOJE' : `Em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`,
                    deadline: `Vencimento: ${func.VencimentoFerias.split('-').reverse().join('/')}`,
                    description: `Planejar as férias do colaborador.`,
                    daysRemaining: diasRestantes
                });
            }
        }

        // 2. Regra de Término de Contrato
        if (func.FimContratoExperiencia) {
            const diasRestantes = calcularDiasRestantes(func.FimContratoExperiencia);

            if (diasRestantes <= DIAS_AVISO_CONTRATO && diasRestantes >= 0) {
                alertas.push({
                    id: `contrato-${func.Nome.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                    type: 'contrato',
                    category: 'funcionario',
                    title: `${func.Nome} (${func.Cargo})`,
                    subtitle: diasRestantes === 0 ? 'Vence HOJE' : `Em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`,
                    deadline: `Término Exp.: ${func.FimContratoExperiencia.split('-').reverse().join('/')}`,
                    description: `Decidir sobre a renovação/efetivação do contrato de experiência.`,
                    daysRemaining: diasRestantes
                });
            }
        }
    });

    // Retorna os alertas ordenados (ex: primeiro os contratos e férias mais urgentes)
    return alertas;
}

/**
 * Gera alertas para Condomínios e Contratos de Serviço
 */
export function gerarAlertasCondominios(condominios: CondominioData[]): Alert[] {
    const alertas: Alert[] = [];
    const DIAS_AVISO_SERVICO = 45;

    condominios.forEach((condo) => {
        if (condo.termino) {
            const diasRestantes = calcularDiasRestantes(condo.termino);

            if (diasRestantes >= 0 && diasRestantes <= DIAS_AVISO_SERVICO) {
                alertas.push({
                    id: `condo-${condo.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'contrato',
                    category: 'condominio',
                    title: condo.nome,
                    subtitle: diasRestantes === 0 ? '⚠️ Vence HOJE!' : `Vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`,
                    deadline: `Término do contrato: ${condo.termino}`,
                    description: `Contrato próximo do vencimento. Iniciar negociação de renovação.${condo.cnpj ? ` CNPJ: ${condo.cnpj}` : ''}`,
                    daysRemaining: diasRestantes
                });
            } else if (diasRestantes < 0 && diasRestantes >= -30) {
                alertas.push({
                    id: `condo-vencido-${condo.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'contrato',
                    category: 'condominio',
                    title: condo.nome,
                    subtitle: `⚠️ VENCIDO há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) > 1 ? 's' : ''}`,
                    deadline: `Venceu em: ${condo.termino}`,
                    description: `Contrato expirou! Regularizar renovação com urgência.${condo.cnpj ? ` CNPJ: ${condo.cnpj}` : ''}`,
                    daysRemaining: diasRestantes
                });
            }
        }
    });

    alertas.sort((a, b) => {
        const isOverdueA = a.subtitle.includes('VENCIDO') ? 0 : 1;
        const isOverdueB = b.subtitle.includes('VENCIDO') ? 0 : 1;
        return isOverdueA - isOverdueB;
    });

    return alertas;
}

/**
 * Gera alertas a partir da Base de Dados RH (FuncionarioData)
 * - Férias: aviso 30 dias + vencido até 30 dias atrás
 * - Contrato Experiência: aviso 10 dias + expirado até 15 dias atrás
 */
export function gerarAlertasRH(funcionarios: FuncionarioData[]): Alert[] {
    const alertas: Alert[] = [];

    funcionarios.forEach((func) => {
        if (func.deleted) return;

        // 1. Alerta de Férias
        if (func.vencimentoFerias) {
            const dias = calcularDiasRestantes(func.vencimentoFerias);

            if (dias >= 0 && dias <= 30) {
                alertas.push({
                    id: `rh-ferias-${func.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'ferias',
                    category: 'funcionario',
                    title: func.nome,
                    subtitle: dias === 0 ? '⚠️ Abre período HOJE' : `Em ${dias} dia${dias > 1 ? 's' : ''}`,
                    deadline: `Período de férias abre em: ${func.vencimentoFerias}`,
                    description: `Planejar período de férias. ${func.cargo ? `Cargo: ${func.cargo}.` : ''} ${func.condominio ? `Alocação: ${func.condominio}.` : ''}`,
                    daysRemaining: dias
                });
            } else if (dias < 0 && dias >= -30) {
                alertas.push({
                    id: `rh-ferias-vencida-${func.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'ferias',
                    category: 'funcionario',
                    title: func.nome,
                    subtitle: `⚠️ VENCIDO há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''}`,
                    deadline: `Venceu em: ${func.vencimentoFerias}`,
                    description: `Período de férias já venceu! Regularizar com urgência.`,
                    daysRemaining: dias
                });
            }
        }

        // 2. Alerta de Contrato de Experiência
        if (func.fimContratoExperiencia) {
            const dias = calcularDiasRestantes(func.fimContratoExperiencia);

            if (dias >= 0 && dias <= 10) {
                alertas.push({
                    id: `rh-contrato-${func.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'contrato',
                    category: 'funcionario',
                    title: func.nome,
                    subtitle: dias === 0 ? '⚠️ Vence HOJE!' : `Em ${dias} dia${dias > 1 ? 's' : ''}`,
                    deadline: `Contrato de experiência termina em: ${func.fimContratoExperiencia}`,
                    description: `Decidir sobre efetivação ou encerramento. ${func.cargo ? `Cargo: ${func.cargo}.` : ''} ${func.condominio ? `Alocação: ${func.condominio}.` : ''}`,
                    daysRemaining: dias
                });
            } else if (dias < 0 && dias >= -15) {
                alertas.push({
                    id: `rh-contrato-vencido-${func.nome.replace(/\s+/g, '-').toLowerCase()}`,
                    type: 'contrato',
                    category: 'funcionario',
                    title: func.nome,
                    subtitle: `⚠️ EXPIRADO há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''}`,
                    deadline: `Expirou em: ${func.fimContratoExperiencia}`,
                    description: `Contrato de experiência expirou! Tomar providências imediatas.`,
                    daysRemaining: dias
                });
            }
        }

        // 3. Aniversário de Empresa (Aviso 15 dias)
        if (func.dataAdmissao) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            let adm: Date;
            if (func.dataAdmissao.includes('/')) {
                const [dia, mes, ano] = func.dataAdmissao.split('/');
                adm = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            } else {
                const [ano, mes, dia] = func.dataAdmissao.split('-');
                adm = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            }

            if (!isNaN(adm.getTime())) {
                const anosEmpresa = hoje.getFullYear() - adm.getFullYear();
                if (anosEmpresa > 0) {
                    const aniversarioAnoAtual = new Date(hoje.getFullYear(), adm.getMonth(), adm.getDate());
                    const diffTime = aniversarioAnoAtual.getTime() - hoje.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays <= 15) {
                        alertas.push({
                            id: `rh-aniversario-${func.nome.replace(/\s+/g, '-').toLowerCase()}`,
                            type: 'ferias',
                            category: 'funcionario',
                            title: func.nome,
                            subtitle: diffDays === 0 ? '🎉 HOJE!' : `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
                            deadline: `Aniversário de Empresa (${anosEmpresa} ano${anosEmpresa > 1 ? 's' : ''})`,
                            description: `Parabenize o colaborador pelo seu tempo de casa!`,
                            daysRemaining: diffDays
                        });
                    }
                }
            }
        }

    });

    alertas.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

    return alertas;
}

