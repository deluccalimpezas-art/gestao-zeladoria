import React, { useState, useMemo } from 'react';
import { FileText, Printer, Users, Wallet, Calendar, AlertCircle, Building2, Search } from 'lucide-react';
import type { FuncionarioData } from '../modelsFinance';

interface PaymentGeneratorViewProps {
    employees: FuncionarioData[];
}

interface PaymentRecord extends FuncionarioData {
    diasTrabalhados: number;
    faltas: number;
    descontoFaltas: number;
    valorDiaria: number;
    totalLiquido: number;
}

export function PaymentGeneratorView({ employees }: PaymentGeneratorViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<Record<string, { faltas: number; salarioBase: number; extras: number; salaofestas: number }>>({});

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.condominio || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const handleAbsenceChange = (id: string, faltas: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { salarioBase: employees.find(e => e.id === id)?.salario || 0, extras: 0, salaofestas: 0 }),
                faltas
            }
        }));
    };

    const handleSalaryChange = (id: string, salarioBase: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, extras: 0, salaofestas: 0 }),
                salarioBase
            }
        }));
    };

    const handleExtrasChange = (id: string, extras: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, salarioBase: employees.find(e => e.id === id)?.salario || 0, salaofestas: 0 }),
                extras
            }
        }));
    };

    const handleSalaoChange = (id: string, salaofestas: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, salarioBase: employees.find(e => e.id === id)?.salario || 0, extras: 0 }),
                salaofestas
            }
        }));
    };

    const selectedEmployeeRecord = useMemo((): PaymentRecord & { extras: number; salaofestas: number } | null => {
        if (!selectedEmployeeId) return null;
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return null;

        const data = paymentData[selectedEmployeeId] || { faltas: 0, salarioBase: emp.salario, extras: 0, salaofestas: 0 };
        const salario = data.salarioBase;
        const valorDiaria = salario / 30;
        const descontoFaltas = valorDiaria * data.faltas;
        const totalLiquido = Math.max(0, salario - descontoFaltas + (data.extras || 0) + (data.salaofestas || 0));

        return {
            ...emp,
            salario: salario,
            faltas: data.faltas,
            extras: data.extras || 0,
            salaofestas: data.salaofestas || 0,
            valorDiaria,
            descontoFaltas,
            totalLiquido,
            diasTrabalhados: 30 - data.faltas
        };
    }, [selectedEmployeeId, employees, paymentData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handlePrint = () => {
        if (!selectedEmployeeId) return;
        window.print();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-emerald-400" />
                        Gerador de Holerites
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere recibos de pagamento com cálculo automático de faltas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
                {/* Employee Selection */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar funcionário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                    
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEmployees.map((emp) => (
                            <button
                                key={emp.id}
                                onClick={() => setSelectedEmployeeId(emp.id || null)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedEmployeeId === emp.id
                                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80'
                                }`}
                            >
                                <div className="text-left">
                                    <p className="font-bold text-sm">{emp.nome}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{emp.condominio || 'Sem Alocação'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono">{formatCurrency(paymentData[emp.id!]?.salarioBase || emp.salario)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calculation Area */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedEmployeeRecord ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            {/* Editor Card */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-emerald-400" /> Configuração do Pagamento
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Salário Base (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.salario || ''}
                                            onChange={(e) => handleSalaryChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Dias de Falta</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            value={selectedEmployeeRecord.faltas || ''}
                                            onChange={(e) => handleAbsenceChange(selectedEmployeeRecord.id!, parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-red-400 font-bold focus:ring-2 focus:ring-red-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Extras (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.extras || ''}
                                            onChange={(e) => handleExtrasChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-blue-400 font-bold focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Salão de Festas (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.salaofestas || ''}
                                            onChange={(e) => handleSalaoChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-purple-400 font-bold focus:ring-2 focus:ring-purple-500/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Valor Diária</p>
                                        <p className="text-sm font-bold text-white">{formatCurrency(selectedEmployeeRecord.valorDiaria)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Desconto Faltas</p>
                                        <p className="text-sm font-bold text-red-400">-{formatCurrency(selectedEmployeeRecord.descontoFaltas)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Adicionais</p>
                                        <p className="text-sm font-bold text-blue-400">+{formatCurrency(selectedEmployeeRecord.extras + selectedEmployeeRecord.salaofestas)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Total Líquido</p>
                                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(selectedEmployeeRecord.totalLiquido)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePrint}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Visualizar / Imprimir Holerite
                                </button>
                            </div>

                            {/* Live Preview (Web Style) */}
                            <div className="bg-white text-slate-900 rounded-sm shadow-2xl p-8 border border-slate-200 pointer-events-none scale-[0.9] origin-top">
                                <div className="border-2 border-slate-900 p-4 space-y-4 text-black">
                                    <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-baseline gap-0 transform scale-75 origin-top">
                                                <span className="text-4xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                                <span className="text-4xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                                            </div>
                                            <div className="text-[18px] text-[#00CEE4] -mt-2 italic font-serif opacity-90">
                                                Gestão em Limpeza
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-500 mb-1">RECIBO DE PAGAMENTO DE SALÁRIO</p>
                                            <p className="text-xs font-bold uppercase">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase">Funcionário</p>
                                            <p className="text-sm font-black">{selectedEmployeeRecord.nome}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400 uppercase">Alocação</p>
                                            <p className="text-sm font-black">{selectedEmployeeRecord.condominio || 'Geral'}</p>
                                        </div>
                                    </div>

                                    <table className="w-full text-left text-[11px] border-collapse mt-4">
                                        <thead>
                                            <tr className="bg-slate-100 border-y border-slate-300">
                                                <th className="p-2">Descrição</th>
                                                <th className="p-2 text-center">Ref.</th>
                                                <th className="p-2 text-right">Vencimentos</th>
                                                <th className="p-2 text-right">Descontos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-100 italic">
                                                <td className="p-2">Salário Base</td>
                                                <td className="p-2 text-center">30d</td>
                                                <td className="p-2 text-right">{formatCurrency(selectedEmployeeRecord.salario)}</td>
                                                <td className="p-2 text-right">-</td>
                                            </tr>
                                            {selectedEmployeeRecord.extras > 0 && (
                                                <tr className="border-b border-slate-100 italic">
                                                    <td className="p-2">Adicionais / Horas Extras</td>
                                                    <td className="p-2 text-center">-</td>
                                                    <td className="p-2 text-right">{formatCurrency(selectedEmployeeRecord.extras)}</td>
                                                    <td className="p-2 text-right">-</td>
                                                </tr>
                                            )}
                                            {selectedEmployeeRecord.salaofestas > 0 && (
                                                <tr className="border-b border-slate-100 italic">
                                                    <td className="p-2">Limpeza Salão de Festas</td>
                                                    <td className="p-2 text-center">-</td>
                                                    <td className="p-2 text-right">{formatCurrency(selectedEmployeeRecord.salaofestas)}</td>
                                                    <td className="p-2 text-right">-</td>
                                                </tr>
                                            )}
                                            {selectedEmployeeRecord.faltas > 0 && (
                                                <tr className="border-b border-slate-100 italic text-red-600">
                                                    <td className="p-2">Faltas não justificadas</td>
                                                    <td className="p-2 text-center">{selectedEmployeeRecord.faltas} {selectedEmployeeRecord.faltas === 1 ? 'Dia' : 'Dias'}</td>
                                                    <td className="p-2 text-right">-</td>
                                                    <td className="p-2 text-right">{formatCurrency(selectedEmployeeRecord.descontoFaltas)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 font-black">
                                                <td colSpan={2} className="p-2 text-right uppercase">Totais</td>
                                                <td className="p-2 text-right text-indigo-900">{formatCurrency(selectedEmployeeRecord.salario + selectedEmployeeRecord.extras + selectedEmployeeRecord.salaofestas)}</td>
                                                <td className="p-2 text-right text-red-600">{formatCurrency(selectedEmployeeRecord.descontoFaltas)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <div className="flex justify-end mt-4">
                                        <div className="bg-indigo-900 text-white p-4 rounded-sm text-right min-w-[200px]">
                                            <p className="text-[10px] font-bold uppercase opacity-80">Valor Líquido a Receber</p>
                                            <p className="text-2xl font-black">{formatCurrency(selectedEmployeeRecord.totalLiquido)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-200">
                                        <div className="text-center space-y-1">
                                            <div className="border-t border-slate-400 w-full pt-2"></div>
                                            <p className="text-[8px] uppercase font-bold text-slate-400">Assinatura da Empresa</p>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="border-t border-slate-400 w-full pt-2"></div>
                                            <p className="text-[8px] uppercase font-bold text-slate-400">Assinatura do Funcionário</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                                <Users className="w-10 h-10 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Selecione um Funcionário</h2>
                            <p className="text-slate-500 max-w-sm mx-auto">Escolha um colaborador na lista ao lado para calcular o pagamento e gerar o holerite.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Only Layout */}
            {selectedEmployeeRecord && (
                <div id="printable-holerite" className="hidden print:block bg-white text-slate-900 p-0 m-0 w-full overflow-hidden">
                    {/* Duplicate Pay Stub for 2 copies per page */}
                    {[1, 2].map((copy) => (
                        <div key={copy} className={`border border-slate-300 p-4 space-y-1 ${copy === 1 ? 'border-b border-dashed mb-16 pb-6' : 'mt-12 pt-6'}`}>
                            <div className="flex justify-between items-start border-b border-slate-200 pb-1">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-0">
                                        <span className="text-3xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                        <span className="text-3xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                                    </div>
                                    <div className="text-[14px] text-[#00CEE4] -mt-1 italic font-serif">
                                        Gestão em Limpeza
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">Mês de Referência</p>
                                        <p className="text-[10px] font-black">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                    </div>
                                    <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Recibo de Pagamento de Salário</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-1 bg-slate-50 border-y border-slate-100">
                                <div className="px-2">
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Colaborador</p>
                                    <p className="text-xs font-black text-slate-900">{selectedEmployeeRecord.nome}</p>
                                </div>
                                <div className="px-2 border-l border-slate-100">
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Alocação</p>
                                    <p className="text-xs font-black text-slate-900">{selectedEmployeeRecord.condominio || 'Geral'}</p>
                                </div>
                            </div>

                            <table className="w-full text-left text-[9px] border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-bold uppercase tracking-widest">
                                        <th className="p-1.5 border border-slate-900">Código / Descrição</th>
                                        <th className="p-1.5 text-center border border-slate-900">Referência</th>
                                        <th className="p-1.5 text-right border border-slate-900">Vencimentos</th>
                                        <th className="p-1.5 text-right border border-slate-900">Descontos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="font-medium text-slate-900 border-b border-slate-100">
                                        <td className="p-1.5 border border-slate-100">001 - Salário Base Mensal</td>
                                        <td className="p-1.5 text-center border border-slate-100">30 Dias</td>
                                        <td className="p-1.5 text-right border border-slate-100">{formatCurrency(selectedEmployeeRecord.salario)}</td>
                                        <td className="p-1.5 text-right border border-slate-100">-</td>
                                    </tr>
                                    {selectedEmployeeRecord.extras > 0 && (
                                        <tr className="font-medium text-slate-900 border-b border-slate-100">
                                            <td className="p-1.5 border border-slate-100">050 - Adicionais / Horas Extras</td>
                                            <td className="p-1.5 text-center border border-slate-100">-</td>
                                            <td className="p-1.5 text-right border border-slate-100">{formatCurrency(selectedEmployeeRecord.extras)}</td>
                                            <td className="p-1.5 text-right border border-slate-100">-</td>
                                        </tr>
                                    )}
                                    {selectedEmployeeRecord.salaofestas > 0 && (
                                        <tr className="font-medium text-slate-900 border-b border-slate-100">
                                            <td className="p-1.5 border border-slate-100">060 - Limpeza Salão de Festas</td>
                                            <td className="p-1.5 text-center border border-slate-100">-</td>
                                            <td className="p-1.5 text-right border border-slate-100">{formatCurrency(selectedEmployeeRecord.salaofestas)}</td>
                                            <td className="p-1.5 text-right border border-slate-100">-</td>
                                        </tr>
                                    )}
                                    <tr className="font-medium text-slate-900 border-b border-slate-100">
                                        <td className="p-1.5 border border-slate-100">401 - Desc. Faltas não Justificadas</td>
                                        <td className="p-1.5 text-center border border-slate-100">{selectedEmployeeRecord.faltas} {selectedEmployeeRecord.faltas === 1 ? 'Dia' : 'Dias'}</td>
                                        <td className="p-1.5 text-right border border-slate-100">-</td>
                                        <td className="p-1.5 text-right border border-slate-100 text-red-600">
                                            {selectedEmployeeRecord.faltas > 0 ? formatCurrency(selectedEmployeeRecord.descontoFaltas) : '-'}
                                        </td>
                                    </tr>
                                    {/* Minimal empty line */}
                                    <tr className="border-b border-slate-100">
                                        <td className="p-1.5 h-6 border border-slate-100 text-slate-300 italic opacity-20">---</td>
                                        <td className="p-1.5 border border-slate-100 text-slate-300 italic opacity-20 text-center">--</td>
                                        <td className="p-1.5 border border-slate-100 text-slate-300 italic opacity-20 text-right">--</td>
                                        <td className="p-1.5 border border-slate-100 text-slate-300 italic opacity-20 text-right">--</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex justify-between items-center mt-2">
                                <div className="w-1/2 bg-slate-50 border border-slate-100 p-1.5 rounded space-y-0.5">
                                    <div className="flex justify-between text-[7px] font-bold uppercase text-slate-500">
                                        <span>Total Vencimentos:</span>
                                        <span>{formatCurrency(selectedEmployeeRecord.salario + selectedEmployeeRecord.extras + selectedEmployeeRecord.salaofestas)}</span>
                                    </div>
                                    <div className="flex justify-between text-[7px] font-bold uppercase text-slate-500">
                                        <span>Total Descontos:</span>
                                        <span className="text-red-600">{formatCurrency(selectedEmployeeRecord.descontoFaltas)}</span>
                                    </div>
                                </div>
                                <div className="w-1/3 bg-indigo-900 text-white p-2 rounded text-right">
                                    <p className="text-[7px] font-black uppercase opacity-70 tracking-widest">Líquido a Receber</p>
                                    <p className="text-lg font-black">{formatCurrency(selectedEmployeeRecord.totalLiquido)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-slate-200">
                                <div className="text-center">
                                    <div className="border-t border-slate-900 w-full pt-1 font-bold text-[9px] uppercase text-slate-600 tracking-widest">
                                        DELUCCA SERVIÇOS PREDIAIS LTDA
                                        <p className="text-[7px] font-normal normal-case italic text-slate-400 font-serif">Assinatura do Empregador</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-slate-900 w-full pt-1 font-bold text-[9px] uppercase text-slate-600 tracking-widest">
                                        {selectedEmployeeRecord.nome}
                                        <p className="text-[7px] font-normal normal-case italic text-slate-400 font-serif">Assinatura do Funcionário</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                        background: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #printable-holerite, #printable-holerite * {
                        visibility: visible;
                    }
                    #printable-holerite {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0.5cm;
                    }
                    @page {
                        margin: 0;
                        size: A4;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            ` }} />
        </div>
    );
}
