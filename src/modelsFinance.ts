export interface NotaFiscalData {
    valor: number;
    dataEmissao: string;
    descricao: string;
    arquivoBase64?: string;
    nomeArquivo?: string;
}

export interface CondominioData {
    id?: string;
    nome: string;
    administradora?: string;
    cnpj: string;
    receitaBruta: number;
    inssRetido: number;
    receitaLiquida: number;
    valorContrato?: number;
    valorVerao?: number;
    cargaHoraria?: string;
    valorAtivo?: 'base' | 'verao';
    inicio?: string;
    termino?: string;
    deleted?: boolean;
    statusNf?: string;
    nfFeita?: boolean;
    nfEnviada?: boolean;
    pagamentoFeito?: boolean;
    notaFiscal?: NotaFiscalData;
    condominioId?: string; // Link to Master RH
}

export interface FuncionarioData {
    id?: string;
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
    funcionarioId?: string; // Link to Master RH
    condominioId?: string; // Link to Condominio model in Master RH
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
