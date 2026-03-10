export interface NotaFiscalData {
    valor: number;
    dataEmissao: string;
    descricao: string;
    arquivoBase64?: string;
    nomeArquivo?: string;
}

export interface CondominioData {
    nome: string;
    cnpj: string;
    receitaBruta: number;
    inssRetido: number;
    receitaLiquida: number;
    valorContrato?: number;
    inicio?: string;
    termino?: string;
    statusNf?: string;
    nfFeita?: boolean;
    nfEnviada?: boolean;
    pagamentoFeito?: boolean;
    notaFiscal?: NotaFiscalData;
}

export interface FuncionarioData {
    condominio: string;
    nome: string;
    cargo?: string;
    salario: number;
    horasExtras?: number;
    vales?: number;
    faltas?: number;
    totalReceber: number;
    statusClt?: 'registrada' | 'precisa_registrar' | 'em_processo' | 'nao_vai_registrar';
    vencimentoFerias?: string;
    fimContratoExperiencia?: string;
    dataAdmissao?: string;
}

export interface ImpostoData {
    nome: string;
    vencimento?: string;
    valor: number;
    observacao?: string;
}

export interface MonthlyFinanceData {
    id: string;
    monthName: string; // Ex: 'Janeiro 2026', 'Planilha Extra'
    receitaBruta: number;
    inssRetido: number;
    receitaLiquida: number;

    // Detalhamento Opcional (se vier nas planilhas)
    totalSalarios?: number;
    totalImpostos?: number;
    lucroEstimado?: number;

    // Lista dos prédios atendidos
    condominios?: CondominioData[];

    // Lista de funcionários e obrigações
    funcionarios?: FuncionarioData[];
    impostos?: ImpostoData[];
}
export interface MasterRHData {
    condominios: CondominioData[];
    funcionarios: FuncionarioData[];
    ultimaAtualizacao: string;
}
