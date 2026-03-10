import * as xlsx from 'xlsx';
import type { MonthlyFinanceData, CondominioData, FuncionarioData, ImpostoData } from '../modelsFinance';

/**
 * Função principal para ler o arquivo enviado e descobrir qual Extrator usar.
 */
export async function parseFinanceExcel(file: File): Promise<MonthlyFinanceData[]> {
    const data = await file.arrayBuffer();
    const workbook = xlsx.read(data);
    const sheetNames = workbook.SheetNames;

    const results: MonthlyFinanceData[] = [];

    // Cenário 1: Arquivo de Fevereiro (Tem abas específicas como "📊 Dashboard" ou "Condomínios")
    if (sheetNames.includes('📊 Dashboard') || sheetNames.includes('Condomínios')) {
        const fevData = extractFevereiroLayout(workbook);
        if (fevData) results.push(fevData);
    }
    // Cenário 2: Arquivo de Novembro, Dezembro, Janeiro (Abas com nomes dos meses)
    else {
        const mesesComuns = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        for (const sheetName of sheetNames) {
            if (mesesComuns.includes(sheetName)) {
                const monthData = extractBasicMonthLayout(workbook, sheetName);
                if (monthData) results.push(monthData);
            }
        }
    }

    if (results.length === 0) {
        throw new Error("Não foi possível identificar o formato da planilha financeira. Certifique-se de ser o padrão do Nexus IA.");
    }

    return results;
}


/**
 * Extrator 1: Layout Simples ("Novembro, dezembro, janeiro.xlsx")
 * Exemplo lido: Row 1 = [null, null, 'Valor bruto', 'INSS', 'Valor Limpo']
 *               Row 2 = [null, 142722.52, 15699.47, 127023.04]
 */
function extractBasicMonthLayout(workbook: xlsx.WorkBook, sheetName: string): MonthlyFinanceData | null {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;

    // Lemos como array 2D
    const rows: unknown[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // A segunda linha (índice 1) costuma ter os totais na planilha do cliente
    if (rows.length >= 2) {
        const totaisRow = rows[1];

        // Na análise do console, os valores estavam espalhados nos índices 6, 7 e 8, 
        // ou logo após colunas vazias. Para sermos resilientes, pegamos os 3 maiores números da linha
        const numericValues = totaisRow.filter((v): v is number => typeof v === 'number' && !isNaN(v));

        if (numericValues.length >= 3) {
            // Normalmente: Receita Bruta é o maior, Liquida o segundo e INSS o menor
            const sorted = [...numericValues].sort((a, b) => b - a);
            const bruto = sorted[0];
            const liquido = sorted[1];
            const inss = sorted[2];

            return {
                id: '', // Empty ID as generated from excel import not db
                monthName: sheetName,
                receitaBruta: bruto,
                receitaLiquida: liquido,
                inssRetido: inss
            };
        }
    }

    return null;
}

/**
 * Extrator 2: Layout Avançado ("financeiro Fevereiro.xlsx")
 * Exemplo lido da aba '📊 Dashboard':
 * Row 2 = ['RECEITA BRUTA', 'INSS (11%)', 'RECEITA LÍQUIDA', 'TOTAL SALÁRIOS', 'TOTAL IMPOSTOS']
 * Row 3 = [207363, 20362.43, 187000.57, 93129, 18781.55, 93871.57]
 */
function extractFevereiroLayout(workbook: xlsx.WorkBook): MonthlyFinanceData | null {
    const sheet = workbook.Sheets['📊 Dashboard']; // Tentamos a aba principal primeiro
    if (!sheet) return null;

    const rows: unknown[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // A aba Dashboard tem a linha 3 (índice 3 considerando que a linha 0 tem o titulo gigante longo)
    // A análise mostra: Row 3 = [Bruto, INSS, Liquida, Salarios, Impostos, LucroEstimado]
    let valRow: unknown[] = [];

    for (const row of rows) {
        if (Array.isArray(row) && row.length >= 4 && typeof row[0] === 'number') {
            valRow = row;
            break;
        }
    }

    if (valRow.length > 0) {
        const condominiosList = extractCondominiosList(workbook);
        const folhaList = extractFolhaList(workbook);
        const impostosList = extractImpostosList(workbook);

        return {
            id: '', // Empty ID
            monthName: 'Fevereiro', // Como a planilha inteira é de fev
            receitaBruta: Number(valRow[0]) || 0,
            inssRetido: Number(valRow[1]) || 0,
            receitaLiquida: Number(valRow[2]) || 0,
            totalSalarios: Number(valRow[3]) || 0,
            totalImpostos: Number(valRow[4]) || 0,
            lucroEstimado: Number(valRow[5]) || 0,
            condominios: condominiosList,
            funcionarios: folhaList,
            impostos: impostosList
        };
    }

    return null;
}

function extractCondominiosList(workbook: xlsx.WorkBook): CondominioData[] {
    const sheet = workbook.Sheets['Condomínios'];
    if (!sheet) return [];

    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const condominios: CondominioData[] = [];

    let startReading = false;
    for (const row of rows) {
        if (!startReading && Array.isArray(row) && row[0] === 'CONDOMÍNIO') {
            startReading = true;
            continue;
        }

        if (startReading && Array.isArray(row) && row.length >= 6) {
            const nomeVal = row[0];
            // Verificamos se há nome válido e se a coluna de 'Valor Bruto' (index 3) é número
            if (typeof nomeVal === 'string' && nomeVal.trim() !== '' && typeof row[3] === 'number') {
                condominios.push({
                    nome: nomeVal,
                    cnpj: typeof row[2] === 'string' ? row[2] : '',
                    receitaBruta: row[3],
                    inssRetido: typeof row[4] === 'number' ? row[4] : 0,
                    receitaLiquida: typeof row[5] === 'number' ? row[5] : 0,
                    inicio: typeof row[6] === 'string' ? row[6] : undefined,
                    termino: typeof row[7] === 'string' ? row[7] : undefined,
                    statusNf: typeof row[9] === 'string' ? row[9] : undefined,
                });
            }
        }
    }

    return condominios;
}

function extractFolhaList(workbook: xlsx.WorkBook): FuncionarioData[] {
    const sheet = workbook.Sheets['Folha de Pagamento'];
    if (!sheet) return [];

    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const funcionarios: FuncionarioData[] = [];

    let startReading = false;
    for (const row of rows) {
        if (!startReading && Array.isArray(row) && row[0] === 'CONDOMÍNIO') {
            startReading = true;
            continue;
        }

        if (startReading && Array.isArray(row) && row.length >= 8) {
            const condominioVal = row[0];
            const nomeVal = row[1];

            if (typeof condominioVal === 'string' && typeof nomeVal === 'string' && nomeVal.trim() !== '') {
                funcionarios.push({
                    condominio: condominioVal,
                    nome: nomeVal,
                    statusClt: typeof row[2] === 'string' ? row[2] as FuncionarioData['statusClt'] : undefined,
                    salario: typeof row[3] === 'number' ? row[3] : 0,
                    vales: typeof row[4] === 'number' ? row[4] : undefined,
                    faltas: typeof row[5] === 'number' ? row[5] : undefined,
                    totalReceber: typeof row[7] === 'number' ? row[7] : 0,
                });
            }
        }
    }

    return funcionarios;
}

function extractImpostosList(workbook: xlsx.WorkBook): ImpostoData[] {
    const sheet = workbook.Sheets['Impostos'];
    if (!sheet) return [];

    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const impostos: ImpostoData[] = [];

    let startReading = false;
    for (const row of rows) {
        if (!startReading && Array.isArray(row) && row[0] === 'IMPOSTO / OBRIGAÇÃO') {
            startReading = true;
            continue;
        }

        if (startReading && Array.isArray(row) && row.length >= 3) {
            const nomeVal = row[0];

            // Para quando chegar no 'TOTAL IMPOSTOS'
            if (typeof nomeVal === 'string' && nomeVal.includes('TOTAL IMPOSTOS')) break;

            if (typeof nomeVal === 'string' && nomeVal.trim() !== '' && typeof row[2] === 'number') {
                impostos.push({
                    nome: nomeVal,
                    vencimento: typeof row[1] === 'string' ? row[1] : undefined,
                    valor: row[2],
                    observacao: typeof row[3] === 'string' ? row[3] : undefined,
                });
            }
        }
    }

    return impostos;
}
