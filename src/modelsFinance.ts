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
    contratoPdf?: any; // Buffer on server, string/Base64 on client
    contratoNome?: string;
    statusNf?: string;
    nfFeita?: boolean;
    nfEnviada?: boolean;
    pagamentoFeito?: boolean;
    notaFiscal?: NotaFiscalData;
    condominioId?: string; // Link to Master RH
    observacao?: string;
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
    statusClt?: 'registrada' | 'precisa_registrar' | 'em_processo' | 'nao_vai_registrar' | 'afastada_inss' | 'ferias';
    vencimentoFerias?: string;
    fimContratoExperiencia?: string;
    dataAdmissao?: string;
    funcionarioId?: string; // Link to Master RH
    condominioId?: string; // Link to Condominio model in Master RH
    deleted?: boolean;
    contratoPdf?: any;
    contratoNome?: string;
    pagamentoFeito?: boolean;
    observacao?: string;
}

export interface ImpostoData {
    nome: string;
    vencimento?: string;
    valor: number;
    observacao?: string;
    pagamentoFeito?: boolean;
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
    inssRate?: number;
    funcionarios?: FuncionarioData[];
    impostos?: ImpostoData[];
    // Observações livres por seção
    observacoesCondominios?: string;
    observacoesFuncionarios?: string;
}
export interface CandidatoData {
    id: string;
    nome: string;
    telefone: string;
    observacao?: string;
    dataRegistro?: string;
}

export interface MasterRHData {
    condominios: CondominioData[];
    funcionarios: FuncionarioData[];
    candidatos?: CandidatoData[];
    ultimaAtualizacao: string;
}

export interface GastoData {
    id?: string;
    descricao: string;
    valor: number;
    categoria?: string;
    data: string; // ISO string
    formaPagto?: string;
    observacao?: string;
    createdAt?: string;
}

export interface PersonalFixedExpenseData {
    id?: string;
    name: string;
    value: number;
    dueDate?: number;
    paid: boolean;
    monthId: string;
}

export interface PersonalCreditCardExpenseData {
    id?: string;
    description: string;
    value: number;
    isInstallment: boolean;
    currentInstallment?: number;
    totalInstallments?: number;
    installmentGroupId?: string;
    category?: string;
    paid: boolean;
    monthId: string;
}

export interface PersonalFinanceMonthData {
    id: string;
    monthName: string;
    year: number;
    month: number;
    fixedExpenses: PersonalFixedExpenseData[];
    cardExpenses: PersonalCreditCardExpenseData[];
}
