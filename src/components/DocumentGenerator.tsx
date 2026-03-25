import { useState } from 'react';
import { FileText, Printer, ChevronRight, Building2, Users } from 'lucide-react';
import type { MonthlyFinanceData } from '../modelsFinance';

interface DocumentGeneratorProps {
    months: MonthlyFinanceData[];
}

export function DocumentGenerator({ months }: DocumentGeneratorProps) {
    const [selectedMonth, setSelectedMonth] = useState<MonthlyFinanceData | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value).replace(/\s/g, '');
    };

    const handlePrint = () => {
        window.print();
    };

    if (months.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
                <FileText className="w-16 h-16 text-slate-700 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Nenhum dado disponível</h2>
                <p className="text-slate-400">Importe planilhas financeiras para começar a gerar documentos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-400" />
                        Gerador de Documentos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere relatórios profissionais e recibos em PDF prontos para impressão.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Month Selection List */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Selecione o Mês do Relatório</h3>
                    <div className="space-y-2">
                        {months.map((m, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedMonth(m)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedMonth?.monthName === m.monthName
                                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedMonth?.monthName === m.monthName ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm">{m.monthName}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedMonth?.monthName === m.monthName ? 'scale-110' : 'opacity-0'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedMonth ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pré-visualização do Relatório</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                                    >
                                        <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                                    </button>
                                </div>
                            </div>

                            {/* Report Sheet (Paper Style) */}
                            <div id="printable-report" className="bg-white text-slate-900 rounded-sm shadow-2xl p-12 min-h-[800px] border border-slate-200 overflow-hidden">
                                {/* Letterhead */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                                    <div>
                                        <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter">Secretaria DeLucca</h1>
                                        <p className="text-xs font-bold text-slate-500 tracking-widest">RELATÓRIO MENSAL DE GESTÃO</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase">{selectedMonth.monthName}</p>
                                        <p className="text-[10px] text-slate-400">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                {/* Summary Grid */}
                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Receita Líquida</p>
                                        <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedMonth.receitaLiquida)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Despesas Totais</p>
                                        <p className="text-2xl font-black text-red-600">{formatCurrency((selectedMonth.totalSalarios || 0) + (selectedMonth.totalImpostos || 0))}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Condomínios Atendidos</p>
                                        <p className="text-2xl font-black text-slate-900">{selectedMonth.condominios?.length || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Colaboradores</p>
                                        <p className="text-2xl font-black text-slate-900">{selectedMonth.funcionarios?.length || 0}</p>
                                    </div>
                                </div>

                                {/* Detailed Tables */}
                                <div className="space-y-8">
                                    <section>
                                        <h4 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5" /> Detalhamento por Condomínio
                                        </h4>
                                        <table className="w-full text-left text-[10px]">
                                            <thead>
                                                <tr className="border-b border-slate-900 font-bold uppercase">
                                                    <th className="py-2">Nome</th>
                                                    <th className="py-2">CNPJ</th>
                                                    <th className="py-2 text-right">Receita Bruta</th>
                                                    <th className="py-2 text-right">Líquida</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedMonth.condominios?.map((c, i) => (
                                                    <tr key={i}>
                                                        <td className="py-2 font-bold">{c.nome}</td>
                                                        <td className="py-2 font-mono text-slate-500">{c.cnpj}</td>
                                                        <td className="py-2 text-right">{formatCurrency(c.receitaBruta)}</td>
                                                        <td className="py-2 text-right font-bold">{formatCurrency(c.receitaLiquida)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> Quadro de Funcionários
                                        </h4>
                                        <table className="w-full text-left text-[10px]">
                                            <thead>
                                                <tr className="border-b border-slate-900 font-bold uppercase">
                                                    <th className="py-2">Nome</th>
                                                    <th className="py-2">Alocação</th>
                                                    <th className="py-2 text-right">Salário</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedMonth.funcionarios?.map((f, i) => (
                                                    <tr key={i}>
                                                        <td className="py-2 font-bold">{f.nome}</td>
                                                        <td className="py-2 text-slate-500">{f.condominio}</td>
                                                        <td className="py-2 text-right">{formatCurrency(f.salario || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </section>
                                </div>

                                <div className="mt-12 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center italic">
                                    Este documento foi gerado automaticamente pelo sistema Secretaria DeLucca e é para uso interno exclusivo.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                                <FileText className="w-10 h-10 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Nenhum mês selecionado</h2>
                            <p className="text-slate-500 max-w-sm mx-auto">Selecione um dos meses na coluna ao lado para visualizar e gerar o relatório correspondente.</p>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-report, #printable-report * {
                        visibility: visible;
                    }
                    #printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 2cm;
                        box-shadow: none;
                        border: none;
                    }
                }
            ` }} />
        </div>
    );
}
