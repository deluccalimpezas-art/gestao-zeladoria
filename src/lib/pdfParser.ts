export interface ExtractedNfData {
    valor: number | null;
    dataEmissao: string | null;
    descricao: string | null;
}

export async function extractTextFromPdf(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');

    // Inform PDF.js where to find the worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        // Ensure string array
        const pageText = textContent.items
            // @ts-ignore - The types for TextItem exist but might be tricky here
            .map(item => item.str || '')
            .join(' ');

        fullText += pageText + '\n';
    }

    return fullText;
}

export function parseNfText(text: string): ExtractedNfData {
    const result: ExtractedNfData = {
        valor: null,
        dataEmissao: null,
        descricao: null
    };

    // --- Extração de Valor ---
    // Procura por "Valor Total da Nota", "Valor Líquido", etc.
    // Ex: "Valor Total da Nota: R$ 1.500,00" ou "VALOR LÍQUIDO R$ 1500,00"
    const valorRegex = /(?:Valor\s+Total|Valor\s+L[íi]quido|Valor\s+da\s+Nota)[^\d]+?R?\$?\s*([\d.,]+)/i;
    const matchValor = text.match(valorRegex);
    if (matchValor && matchValor[1]) {
        // Limpar pontos de milhar e trocar virgula por ponto
        const valorLimpo = matchValor[1].replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(valorLimpo);
        if (!isNaN(num)) result.valor = num;
    }

    // --- Extração de Data ---
    // Ex: "Data e Hora da Emissão 25/08/2023 14:30" ou "Data de Emissão : 25/08/2023"
    const dataRegex = /(?:Data\s+de\s+Emiss[ãa]o|Data\s+e\s+Hora[\s\S]+?Emiss[ãa]o)[^\d]+?(\d{2}\/\d{2}\/\d{4})/i;
    const matchData = text.match(dataRegex);
    if (matchData && matchData[1]) {
        // Converter de DD/MM/YYYY para YYYY-MM-DD
        const parts = matchData[1].split('/');
        if (parts.length === 3) {
            result.dataEmissao = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    // --- Extração de Descrição ---
    // Padrão Prefeitura de Itapema (DANFSe v1.0)
    // O texto fica entre "Descrição do Serviço" e "TRIBUTAÇÃO MUNICIPAL"

    // Expressão regular que tenta pegar a descrição usando a marcação de Início e da próxima grande Seção
    const descRegex = /Descri[çc][ãa]o\s+do\s+Servi[çc]o\s+([\s\S]*?)(?:TRIBUTA[ÇC][ÃA]O\s+MUNICIPAL|TRIBUTA[ÇC][ÃA]O|VALOR\s+ACRESCIDO)/i;
    const matchDesc = text.match(descRegex);

    if (matchDesc && matchDesc[1]) {
        let cleaned = matchDesc[1].trim();

        // Remove quebras de linha excessivas mantendo o texto corrido, mas legível
        cleaned = cleaned.replace(/\s{2,}/g, '\n');

        // Safety limitter para caso o regex falhe em pegar o final
        if (cleaned.length > 500) {
            cleaned = cleaned.substring(0, 500) + '...';
        }

        result.descricao = cleaned;
    }

    return result;
}
