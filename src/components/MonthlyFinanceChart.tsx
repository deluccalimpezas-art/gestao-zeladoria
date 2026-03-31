'use client'

import React, { useMemo } from 'react';
import type { MonthlyFinanceData } from '../modelsFinance';
import { TrendingUp, DollarSign } from 'lucide-react';

interface MonthlyFinanceChartProps {
    monthsData: MonthlyFinanceData[];
}

const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthlyFinanceChart({ monthsData }: MonthlyFinanceChartProps) {
    const chartData = useMemo(() => {
        if (!monthsData || monthsData.length === 0) return [];

        return [...monthsData]
            .map(month => {
                const parts = month.monthName.split(' ');
                const monthIdx = MONTHS_PT.indexOf(parts[0]);
                const year = parseInt(parts[1]) || new Date().getFullYear();
                
                const totalSaida = (month.totalSalarios || 0) + (month.totalImpostos || 0) + (month.totalGastos || 0) + (month.totalRescisao || 0);
                const lucro = month.lucroEstimado ?? (month.receitaLiquida - totalSaida);
                
                return {
                    name: month.monthName,
                    shortName: parts[0].substring(0, 3).toUpperCase(),
                    faturamento: month.receitaBruta || 0,
                    lucro: lucro || 0,
                    date: new Date(year, monthIdx, 1)
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-12); // Alterado para 12 meses conforme solicitado
    }, [monthsData]);

    if (chartData.length < 2) return null;

    const allValues = chartData.flatMap(d => [d.faturamento, d.lucro]);
    const maxVal = Math.max(...allValues, 1000) * 1.1;
    const minVal = Math.min(0, ...allValues);
    const range = maxVal - minVal;

    const getY = (val: number) => 180 - ((val - minVal) / range) * 160;
    const getX = (idx: number) => (idx / (chartData.length - 1)) * 100;

    const faturamentoPoints = chartData.map((d, i) => `${getX(i)},${getY(d.faturamento)}`).join(' ');
    const lucroPoints = chartData.map((d, i) => `${getX(i)},${getY(d.lucro)}`).join(' ');

    const formatShortCurrency = (val: number) => {
        if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
        return val.toFixed(0);
    };

    return (
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-[2rem] p-10 shadow-xl relative overflow-hidden backdrop-blur-md animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                         Performance Anual (Últimos 12 Meses)
                    </h2>
                </div>
                
                <div className="flex items-center gap-8 bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Faturamento</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lucro</span>
                    </div>
                </div>
            </div>

            <div className="h-72 w-full relative group px-2">
                <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between py-5 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    <span>{formatShortCurrency(maxVal)}</span>
                    <span>{formatShortCurrency(minVal + range * 0.75)}</span>
                    <span>{formatShortCurrency(minVal + range * 0.5)}</span>
                    <span>{formatShortCurrency(minVal + range * 0.25)}</span>
                    <span>{formatShortCurrency(minVal)}</span>
                </div>

                <svg viewBox="0 -10 100 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {chartData.map((_, i) => (
                        i % 2 === 1 && (
                            <rect 
                                key={`band-${i}`}
                                x={getX(i-1)} 
                                y="-10" 
                                width={getX(i) - getX(i-1)} 
                                height="210" 
                                fill="#ffffff" 
                                fillOpacity="0.03"
                            />
                        )
                    ))}

                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line 
                            key={`grid-${i}`} 
                            x1="0" y1={180 - p * 160} 
                            x2="100" y2={180 - p * 160} 
                            stroke="#334155" 
                            strokeWidth="0.15" 
                            strokeOpacity="0.3"
                        />
                    ))}

                    <polyline 
                        points={faturamentoPoints} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.2" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                    />

                    <polyline 
                        points={lucroPoints} 
                        fill="none" 
                        stroke="#14b8a6" 
                        strokeWidth="1.5" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                    />

                    {chartData.map((d, i) => (
                        <React.Fragment key={`dots-${i}`}>
                            <circle cx={getX(i)} cy={getY(d.faturamento)} r="0.6" fill="#3b82f6" />
                            <circle cx={getX(i)} cy={getY(d.lucro)} r="0.8" fill="#14b8a6" />
                        </React.Fragment>
                    ))}
                </svg>

                <div className="absolute left-0 right-0 -bottom-8 flex justify-between">
                    {chartData.map((d, i) => (
                        <span key={`label-${i}`} className="text-[8px] font-black text-slate-500 uppercase tracking-tighter text-center w-6">
                            {d.shortName}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20 pt-10 border-t border-slate-700/30 relative z-10">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/20 flex flex-col items-center text-center">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Faturamento Médio</p>
                    <p className="text-2xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.reduce((acc, d) => acc + d.faturamento, 0) / chartData.length).replace(/\s/g, '')}
                    </p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/20 flex flex-col items-center text-center backdrop-blur-xl">
                    <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">Lucro Médio</p>
                    <p className="text-2xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.reduce((acc, d) => acc + d.lucro, 0) / chartData.length).replace(/\s/g, '')}
                    </p>
                </div>
            </div>
        </div>
    );
}
