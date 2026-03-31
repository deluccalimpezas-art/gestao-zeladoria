'use client'

import React, { useMemo } from 'react';
import type { MonthlyFinanceData } from '../modelsFinance';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

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
                    shortName: parts[0].substring(0, 3),
                    faturamento: month.receitaBruta || 0,
                    lucro: lucro || 0,
                    date: new Date(year, monthIdx, 1)
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-6); // Mostrar apenas os últimos 6 meses para não poluir
    }, [monthsData]);

    if (chartData.length < 2) return null;

    const maxVal = Math.max(...chartData.map(d => Math.max(d.faturamento, d.lucro, 1000)));
    const minVal = Math.min(0, ...chartData.map(d => d.lucro));
    const range = maxVal - minVal;

    const getY = (val: number) => 200 - ((val - minVal) / range) * 160;
    const getX = (idx: number) => (idx / (chartData.length - 1)) * 100;

    const faturamentoPoints = chartData.map((d, i) => `${getX(i)},${getY(d.faturamento)}`).join(' ');
    const lucroPoints = chartData.map((d, i) => `${getX(i)},${getY(d.lucro)}`).join(' ');
    
    // Area paths
    const faturamentoArea = `${faturamentoPoints} ${getX(chartData.length - 1)},200 0,200`;
    const lucroArea = `${lucroPoints} ${getX(chartData.length - 1)},200 0,200`;

    const formatShortCurrency = (val: number) => {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        return val.toFixed(0);
    };

    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm animate-in fade-in duration-700">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <DollarSign className="w-32 h-32 text-indigo-500 rotate-12" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" /> Performance Mensal
                    </h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter mt-1">Comparativo de Faturamento vs Lucratividade</p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro</span>
                    </div>
                </div>
            </div>

            <div className="h-64 w-full relative group">
                {/* SVG Chart */}
                <svg viewBox="0 0 100 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line 
                            key={i} 
                            x1="0" y1={200 - p * 160} 
                            x2="100" y2={200 - p * 160} 
                            stroke="#334155" 
                            strokeWidth="0.1" 
                            strokeDasharray="1,1"
                        />
                    ))}

                    {/* Areas */}
                    <polyline points={faturamentoArea} fill="url(#gradFat)" />
                    <polyline points={lucroArea} fill="url(#gradLucro)" />

                    {/* Lines */}
                    <polyline 
                        points={faturamentoPoints} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                        className="drop-shadow-lg shadow-blue-500/50"
                    />
                    <polyline 
                        points={lucroPoints} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                        className="drop-shadow-lg shadow-emerald-500/50"
                    />

                    {/* Dots */}
                    {chartData.map((d, i) => (
                        <React.Fragment key={i}>
                            <circle 
                                cx={getX(i)} cy={getY(d.faturamento)} r="1.2" 
                                fill="#0f172a" stroke="#3b82f6" strokeWidth="0.5"
                                className="transition-all duration-300 hover:r-2"
                            />
                            <circle 
                                cx={getX(i)} cy={getY(d.lucro)} r="1.5" 
                                fill="#0f172a" stroke="#10b981" strokeWidth="0.8"
                                className="transition-all duration-300 hover:r-2"
                            />
                        </React.Fragment>
                    ))}
                </svg>

                {/* X Axis Labels */}
                <div className="absolute left-0 right-0 -bottom-8 flex justify-between px-1">
                    {chartData.map((d, i) => (
                        <span key={i} className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                            {d.shortName}
                        </span>
                    ))}
                </div>

                {/* Y Axis Mini Labels */}
                <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between py-2 text-[8px] font-black text-slate-600 uppercase">
                    <span>{formatShortCurrency(maxVal)}</span>
                    <span>{formatShortCurrency(minVal + range * 0.5)}</span>
                    <span>{minVal === 0 ? '0' : formatShortCurrency(minVal)}</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mt-16 pt-8 border-t border-slate-700/50 relative z-10">
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Média Faturamento</p>
                    <p className="text-xl font-black text-white italic">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.reduce((acc, d) => acc + d.faturamento, 0) / chartData.length).replace(/\s/g, '')}
                    </p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Média Lucro</p>
                    <p className="text-xl font-black text-white italic">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chartData.reduce((acc, d) => acc + d.lucro, 0) / chartData.length).replace(/\s/g, '')}
                    </p>
                </div>
            </div>
        </div>
    );
}
