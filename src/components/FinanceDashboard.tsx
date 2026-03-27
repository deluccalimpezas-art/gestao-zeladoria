import React, { useState } from 'react';
import { DollarSign, Users, Building, ArrowRight, CalendarDays, Trash2, Copy, Plus } from 'lucide-react';
import type { MonthlyFinanceData } from '../modelsFinance';
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
                <>
                    {/* Bloco: Visão de Meses Detalhada */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-emerald-500" /> Planilhas Analisadas
                            </h2>
                            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                                {monthsData.length} meses disponíveis
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {monthsData.map((month, idx) => (
                                <div key={idx} className="relative group">
                                    <button
                                        onClick={() => setSelectedMonth(month)}
                                        className="w-full h-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700/50 rounded-xl p-5 shadow flex flex-col text-left transition-all"
                                    >
                                        <div className="flex w-full justify-between items-start mb-3">
                                            <span className="text-sm font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                                                {month.monthName}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-center py-4">
                                            <CalendarDays className="w-12 h-12 text-slate-700 group-hover:text-emerald-500/20 transition-colors" />
                                        </div>
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
                            ))}
                        </div>
                    </section>
                </>
            )
            }
        </div >
    );
}
