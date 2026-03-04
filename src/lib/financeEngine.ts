import type { MonthlyFinanceData } from '../modelsFinance';

export function calculateFinanceSummary(monthsData: MonthlyFinanceData[]) {
    const totalMonths = monthsData.length;
    if (totalMonths === 0) {
        return {
            totalReceitaBruta: 0,
            mediaReceitaBruta: 0,
            totalReceitaLiquida: 0,
            mediaReceitaLiquida: 0,
            totalInss: 0,
            mediaInss: 0,
            totalFolha: 0,
            totalLucro: 0,
            mediaLucro: 0,
        };
    }

    const totalReceitaBruta = monthsData.reduce((acc, curr) => acc + curr.receitaBruta, 0);
    const totalReceitaLiquida = monthsData.reduce((acc, curr) => acc + curr.receitaLiquida, 0);
    const totalInss = monthsData.reduce((acc, curr) => acc + curr.inssRetido, 0);
    const totalFolha = monthsData.reduce((acc, curr) => acc + (curr.totalSalarios || 0), 0);
    const totalLucro = monthsData.reduce((acc, curr) => acc + (curr.lucroEstimado || 0), 0);

    return {
        totalReceitaBruta,
        mediaReceitaBruta: totalReceitaBruta / totalMonths,
        totalReceitaLiquida,
        mediaReceitaLiquida: totalReceitaLiquida / totalMonths,
        totalInss,
        mediaInss: totalInss / totalMonths,
        totalFolha,
        totalLucro,
        mediaLucro: totalLucro / totalMonths,
    };
}
