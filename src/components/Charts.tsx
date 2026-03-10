import { useMemo } from 'react';
import type { MonthlyFinanceData } from '../modelsFinance';

interface ChartsProps {
    data: MonthlyFinanceData[];
}

export function Charts({ data }: ChartsProps) {
    const sortedData = useMemo(() => {
        return [...data].reverse().slice(-6); // Last 6 months (data originally desc from DB, reverse for left-to-right chart)
    }, [data]);

    if (sortedData.length === 0) return null;

    const maxRevenue = Math.max(...sortedData.map(d => d.receitaBruta || 0), 1000);
    const chartHeight = 200;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Desempenho Financeiro</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-400">Receita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-slate-400">Lucro</span>
                    </div>
                </div>
            </div>

            <div className="relative h-[250px] w-full flex items-end justify-between px-4 pb-8 pt-4">
                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <div
                        key={i}
                        className="absolute w-full border-t border-slate-700/50 text-[10px] text-slate-500 pr-2 text-right"
                        style={{ bottom: `${p * chartHeight + 32}px`, left: 0 }}
                    >
                        <span className="absolute -left-2 -translate-x-full">
                            {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(maxRevenue * p)}
                        </span>
                    </div>
                ))}

                {/* Bars */}
                {sortedData.map((m, i) => {
                    const revenueHeight = (m.receitaBruta / maxRevenue) * chartHeight;
                    const profit = (m.receitaLiquida || 0) - ((m.totalSalarios || 0) + (m.totalImpostos || 0));
                    const profitHeight = (Math.max(0, profit) / maxRevenue) * chartHeight;

                    return (
                        <div key={i} className="relative flex flex-col items-center group flex-1">
                            <div className="flex items-end gap-1 mb-1">
                                <div
                                    className="w-4 bg-emerald-500/80 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-400"
                                    style={{ height: `${revenueHeight}px` }}
                                    title={`Receita: R$ ${m.receitaBruta.toLocaleString()}`}
                                ></div>
                                <div
                                    className="w-4 bg-indigo-500/80 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-400"
                                    style={{ height: `${profitHeight}px` }}
                                    title={`Lucro: R$ ${profit.toLocaleString()}`}
                                ></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-[60px]">
                                {m.monthName}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
