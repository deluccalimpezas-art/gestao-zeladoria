export interface FuncionarioCSV {
    Nome: string;
    Cargo: string;
    FimContratoExperiencia?: string; // Formato esperado: YYYY-MM-DD
    VencimentoFerias?: string;       // Formato esperado: YYYY-MM-DD
}
