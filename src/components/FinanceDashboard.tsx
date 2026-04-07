import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Users, Building, ArrowRight, CalendarDays, Trash2, Copy, Plus, ArrowUpDown, Move } from 'lucide-react';
import { MonthlyFinanceChart } from './MonthlyFinanceChart';
import type { MonthlyFinanceData } from '../modelsFinance';
import { updateFinanceMonthsOrder } from '../../app/actions';
import dynamic from 'next/dynamic';
const MonthDetailView = dynamic(() => import('./MonthDetailView').then(mod => mod.MonthDetailView), {
    ssr: false,
    loading: () => <div className="p-20 text-center text-slate-400">Carregando detalhes...</div>
});

interface FinanceDashboardProps {
    monthsData: MonthlyFinanceData[];
    employeesCount: number;
    onDeleteMonth: (monthName: string) => void;
    onUpdateMonth: (updatedMonth: MonthlyFinanceData) => void;
    onDuplicateMonth: (month: MonthlyFinanceData) => void;
    onCreateFromRHBase: () => void;
    hasRHBase: boolean;
}

export function FinanceDashboard({ monthsData, employeesCount, onDeleteMonth, onUpdateMonth, onDuplicateMonth, onCreateFromRHBase, hasRHBase }: FinanceDashboardProps) {
    const [selectedMonth, setSelectedMonth] = useState<MonthlyFinanceData | null>(null);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [localMonths, setLocalMonths] = useState<MonthlyFinanceData[]>([]);

    const monthsInPt = useMemo(() => [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ], []);

    const sortedMonths = useMemo(() => {
        return [...monthsData].sort((a, b) => {
            const [mA, yA] = a.monthName.split(' ');
            const [mB, yB] = b.monthName.split(' ');
            const timeA = new Date(parseInt(yA), monthsInPt.indexOf(mA), 1).getTime();
            const timeB = new Date(parseInt(yB), monthsInPt.indexOf(mB), 1).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [monthsData, sortOrder, monthsInPt]);

    useEffect(() => {
        setLocalMonths(sortedMonths);
    }, [sortedMonths]);

    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetIdx: number) => {
        if (draggedIdx === null || draggedIdx === targetIdx) return;
        
        const newList = [...localMonths];
        const [movedItem] = newList.splice(draggedIdx, 1);
        newList.splice(targetIdx, 0, movedItem);
        
        setLocalMonths(newList);
        setDraggedIdx(null);

        // Persist order
        const ids = newList.map(m => m.id).filter(id => !!id) as string[];
        if (ids.length > 0) {
            await updateFinanceMonthsOrder(ids);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value).replace(/\s/g, '');
    };

    // Se tem um mês selecionado, renderizar o detalhe
    if (selectedMonth) {
        return (
            <MonthDetailView
                key={selectedMonth.id || selectedMonth.monthName}
                month={selectedMonth}
                onBack={() => setSelectedMonth(null)}
                onSave={(updated) => {
                    onUpdateMonth(updated);
                }}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Painel Financeiro</h1>
                </div>
                <div>
                    <div className="flex flex-col md:flex-row gap-3">
                        {hasRHBase ? (
                            <button
                                onClick={onCreateFromRHBase}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Criar Novo Mês da Base RH
                            </button>
                        ) : (
                            <div className="text-sm text-slate-400 flex items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
                                Preencha a Base RH primeiro para criar os meses!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {monthsData.length === 0 && (
                <div className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition-colors rounded-2xl p-16 text-center shadow-lg w-full mt-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-indigo-500`}></div>
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
                        <DollarSign className="w-10 h-10 text-indigo-500" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">Seu Painel Financeiro está vazio</h3>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg mb-8 leading-relaxed">
                        Seu fluxo de trabalho agora é muito mais simples. Basta ter os Condomínios e Funcionários listados na Base RH e criar um mês novo para que o sistema puxe e cruze os dados automaticamente.
                    </p>
                    {hasRHBase ? (
                        <button
                            onClick={onCreateFromRHBase}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-full text-base font-bold transition-all transform hover:scale-105 shadow-xl shadow-indigo-500/30"
                        >
                            <Plus className="w-5 h-5" /> Criar o Primeiro Mês (Base RH)
                        </button>
                    ) : (
                        <p className="text-amber-500 font-bold bg-amber-500/10 p-4 rounded-xl">Vá para a Aba Base de Dados RH primeiro e cadastre seus condomínios!</p>
                    )}
                </div>
            )}

            {monthsData.length > 0 && (
                <div className="space-y-12">
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Meses Individuais</h3>
                             <button 
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 transition-all"
                             >
                                <ArrowUpDown className="w-3 h-3" />
                                {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
                             </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {localMonths.map((month, idx) => {
                                const totalSaida = (month.totalSalarios || 0) + (month.totalImpostos || 0) + (month.totalGastos || 0) + (month.totalRescisao || 0);
                                const lucro = month.lucroEstimado ?? (month.receitaLiquida - totalSaida);

                                return (
                                    <div 
                                        key={month.id || idx} 
                                        className={`relative group transition-all duration-300 ${draggedIdx === idx ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(idx)}
                                    >
                                        <div className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-600 hover:text-indigo-400 z-10 hidden sm:block">
                                            <Move className="w-4 h-4" />
                                        </div>
                                        <button
                                            onClick={() => setSelectedMonth(month)}
                                            className="w-full bg-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/80 rounded-2xl py-6 px-4 shadow-xl flex items-center justify-center text-center transition-all active:scale-[0.98] group"
                                        >
                                            <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-400 transition-colors">
                                                {month.monthName}
                                            </span>
                                        </button>
                                        <div className="absolute -top-2 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDuplicateMonth(month); }}
                                                className="bg-indigo-500/90 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg hover:scale-110"
                                                title="Duplicar Mês"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteMonth(month.monthName); }}
                                                className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110"
                                                title="Excluir Mês"
                                            >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                </div>
            )}
        </div >
    );
}
