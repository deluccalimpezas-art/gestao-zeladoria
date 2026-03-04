export type AlertType = 'ferias' | 'contrato' | 'tarefa';

export interface Alert {
    id: string;
    type: AlertType;
    category?: 'funcionario' | 'condominio';
    title: string;
    subtitle: string;
    description: string;
    deadline: string;
}

export interface CondominioCSV {
    Nome: string;
    CNPJ: string;
    DataTermino: string; // Esperado DD/MM/YYYY ou YYYY-MM-DD
}
