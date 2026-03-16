import React, { useState } from 'react';
import { Upload, DollarSign, TrendingUp, TrendingDown, Percent, Activity, Users, Building, ArrowRight, CalendarDays, Trash2, Copy, Plus } from 'lucide-react';
import type { MonthlyFinanceData } from '../modelsFinance';
import { calculateFinanceSummary } from '../lib/financeEngine';
import { Charts } from './Charts';
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
    const summary = calculateFinanceSummary(monthsData);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Contar condominios unicos na carteira baseado no ultimo mes ou soma geral
    const totalCondominios = React.useMemo(() => {
        if (monthsData.length === 0) return 0;
        // O ideal é pegar a quantidade do mês mais recente (no nosso caso pode ser o último do array)
        const lastMonth = monthsData[monthsData.length - 1];
        return lastMonth.condominios?.length || 0;
    }, [monthsData]);

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
                    <p className="text-slate-400 mt-1">Acumulados e médias anuais gerados a partir da base do RH.</p>
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
                    {/* Gráfico de Desempenho */}
                    <Charts data={monthsData} />

                    {/* Bloco 1: Acumulado Anual */}
                    <section>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-indigo-400" /> Resultados Anuais (YTD)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Receita Bruto Acumulada</p>
                                <h3 className="text-xl font-bold text-white">{formatCurrency(summary.totalReceitaBruta)}</h3>
                                <Activity className="absolute -bottom-2 -right-2 w-12 h-12 text-slate-700/20" />
                            </div>
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Liquidez Acumulada</p>
                                <h3 className="text-xl font-bold text-emerald-400">{formatCurrency(summary.totalReceitaLiquida)}</h3>
                                <DollarSign className="absolute -bottom-2 -right-2 w-12 h-12 text-slate-700/20" />
                            </div>
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">INSS Retido Total</p>
                                <h3 className="text-xl font-bold text-amber-500">{formatCurrency(summary.totalInss)}</h3>
                                <TrendingDown className="absolute -bottom-2 -right-2 w-12 h-12 text-slate-700/20" />
                            </div>
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl relative overflow-hidden group border-blue-500/30">
                                <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Folha de Pagamento Anual</p>
                                <h3 className="text-xl font-bold text-blue-400">{formatCurrency(summary.totalFolha)}</h3>
                                <Users className="absolute -bottom-2 -right-2 w-12 h-12 text-blue-500/10" />
                            </div>
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Lucro Líquido Anual</p>
                                <h3 className="text-xl font-black text-white">{formatCurrency(summary.totalLucro)}</h3>
                                <TrendingUp className="absolute -bottom-2 -right-2 w-12 h-12 text-indigo-500/20" />
                            </div>
                        </div>
                    </section>

                    {/* Bloco 2: Médias e Operacional */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Médias Mensais */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-blue-400" /> Médias Mensais Estimadas
                            </h3>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                    <span className="text-slate-400">Bruto Médio/mês</span>
                                    <span className="text-lg font-medium text-white">{formatCurrency(summary.mediaReceitaBruta)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                    <span className="text-slate-400">Líquido Médio/mês</span>
                                    <span className="text-lg font-bold text-emerald-400">{formatCurrency(summary.mediaReceitaLiquida)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                                    <span className="text-slate-400">INSS Médio/mês</span>
                                    <span className="text-lg font-medium text-amber-400/90">{formatCurrency(summary.mediaInss)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-indigo-400">Lucro Médio/mês</span>
                                    <span className="text-xl font-black text-white">{formatCurrency(summary.mediaLucro)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Painel Operacional */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
                            <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
                                <Building className="w-5 h-5 text-purple-400" /> Visão Operacional Atual
                            </h3>
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700 flex flex-col items-center justify-center text-center group hover:border-purple-500/50 transition-colors">
                                    <Building className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <h4 className="text-3xl font-black text-white">{totalCondominios}</h4>
                                    <p className="text-xs text-slate-400 font-medium uppercase mt-1">Condomínios</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700 flex flex-col items-center justify-center text-center group hover:border-blue-500/50 transition-colors">
                                    <Users className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <h4 className="text-3xl font-black text-white">
                                        {monthsData[monthsData.length - 1]?.funcionarios?.length || employeesCount}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium uppercase mt-1">Funcionários</p>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* Bloco 3: Visão de Meses Detalhada */}
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
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Bruto</span>
                                                <h4 className="text-base font-bold text-white transition-colors group-hover:text-indigo-300">{formatCurrency(month.receitaBruta)}</h4>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Retido NF (INSS)</span>
                                                <h4 className="text-sm font-bold text-red-400">{formatCurrency(month.inssRetido || 0)}</h4>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Líquido</span>
                                                <h4 className="text-sm font-bold text-emerald-400">{formatCurrency(month.receitaLiquida)}</h4>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                            <p className="text-[10px] uppercase font-bold text-slate-500">
                                                {month.condominios?.length || 0} Condomínios
                                            </p>
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
