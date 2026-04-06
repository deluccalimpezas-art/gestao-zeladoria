import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Users, Wallet, Calendar, AlertCircle, Building2, Search, ChevronDown, Copy } from 'lucide-react';
import type { FuncionarioData } from '../modelsFinance';
import { MONTHS, getHolidays } from '@/lib/holidayUtils';
import { getMonthlyFinanceByMonth, updateMonthlyFuncionario } from '../../app/actions';

interface PaymentGeneratorViewProps {
    employees: FuncionarioData[];
    initialEmployeeId?: string | null;
    initialMonth?: number;
    initialYear?: number;
}

interface PaymentRecord extends FuncionarioData {
    diasTrabalhados: number;
    faltas: number;
    vales: number;
    descontoFaltas: number;
    valorDiaria: number;
    totalLiquido: number;
}

export function PaymentGeneratorView({ 
    employees, 
    initialEmployeeId = null,
    initialMonth = new Date().getMonth() + 1,
    initialYear = new Date().getFullYear()
}: PaymentGeneratorViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(initialEmployeeId);
    const [paymentData, setPaymentData] = useState<Record<string, { faltas: number; salarioBase: number; extras: number; salaofestas: number; vales: number }>>({});
    const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
    const [selectedYear, setSelectedYear] = useState<number>(initialYear);
    const [showHolidays, setShowHolidays] = useState(false);
    const [monthlyFuncs, setMonthlyFuncs] = useState<any[]>([]);
    const [isSavingSync, setIsSavingSync] = useState<string | null>(null);

    const holidays = getHolidays(selectedMonth, selectedYear);

    const filteredEmployees = useMemo(() => {
        return employees
            .filter(emp =>
                emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (emp.condominio || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [employees, searchTerm]);

    const handleAbsenceChange = (id: string, faltas: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { salarioBase: employees.find(e => e.id === id)?.salario || 0, extras: 0, salaofestas: 0, vales: 0 }),
                faltas
            }
        }));
    };

    const handleSalaryChange = (id: string, salarioBase: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, extras: 0, salaofestas: 0, vales: 0 }),
                salarioBase
            }
        }));
    };

    const handleExtrasChange = (id: string, extras: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, salarioBase: employees.find(e => e.id === id)?.salario || 0, salaofestas: 0, vales: 0 }),
                extras
            }
        }));
    };

    const handleSalaoChange = (id: string, salaofestas: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, salarioBase: employees.find(e => e.id === id)?.salario || 0, extras: 0, vales: 0 }),
                salaofestas
            }
        }));
    };

    const handleValesChange = (id: string, vales: number) => {
        setPaymentData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { faltas: 0, salarioBase: employees.find(e => e.id === id)?.salario || 0, extras: 0, salaofestas: 0 }),
                vales
            }
        }));
    };

    const selectedEmployeeRecord = useMemo((): PaymentRecord & { extras: number; salaofestas: number; vales: number } | null => {
        if (!selectedEmployeeId) return null;
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return null;

        const data = paymentData[selectedEmployeeId] || { faltas: 0, salarioBase: emp.salario, extras: 0, salaofestas: 0, vales: 0 };
        const salario = data.salarioBase;
        const valorDiaria = salario / 30;
        const descontoFaltas = valorDiaria * data.faltas;
        const totalLiquido = Math.max(0, salario - descontoFaltas + (data.extras || 0) + (data.salaofestas || 0) - (data.vales || 0));

        return {
            ...emp,
            salario: salario,
            faltas: data.faltas,
            extras: data.extras || 0,
            salaofestas: data.salaofestas || 0,
            vales: data.vales || 0,
            valorDiaria,
            descontoFaltas,
            totalLiquido,
            diasTrabalhados: 30 - data.faltas
        };
    }, [selectedEmployeeId, employees, paymentData]);

    // Fetch monthly data when month/year changes
    useEffect(() => {
        const fetchMonthlyData = async () => {
            const monthName = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
            console.log(`Buscando dados mensais (Folha): ${monthName}`);
            const result = await getMonthlyFinanceByMonth(monthName);
            if (result.success && result.data) {
                const funcs = result.data.funcionarios || [];
                setMonthlyFuncs(funcs);
                
                // Auto-fill paymentData for employees that have records in this month
                const newPaymentData = { ...paymentData };
                let changed = false;
                
                funcs.forEach((mf: any) => {
                    if (mf.funcionarioId && (!paymentData[mf.funcionarioId] || paymentData[mf.funcionarioId].salarioBase === 0)) {
                        newPaymentData[mf.funcionarioId] = {
                            faltas: 0,
                            salarioBase: mf.valorPago || 0,
                            extras: mf.horasExtras || 0,
                            salaofestas: 0,
                            vales: 0
                        };
                        changed = true;
                    }
                });
                
                if (changed) setPaymentData(newPaymentData);
            } else {
                setMonthlyFuncs([]);
            }
        };
        fetchMonthlyData();
    }, [selectedMonth, selectedYear]);

    const handleSaveToFinance = async (employeeId: string, recordId: string) => {
        const data = paymentData[employeeId];
        if (!data) return;

        setIsSavingSync(employeeId);
        try {
            const result = await updateMonthlyFuncionario(recordId, {
                valorPago: data.salarioBase,
                horasExtras: data.extras,
                observacao: employees.find(e => e.id === employeeId)?.observacao // or separate obs
            });
            if (result.success) {
                // Refresh monthly data
                const monthName = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
                const refresh = await getMonthlyFinanceByMonth(monthName);
                if (refresh.success && refresh.data) {
                    setMonthlyFuncs(refresh.data.funcionarios || []);
                }
                alert('Dados atualizados na planilha financeira!');
            } else {
                alert('Erro ao salvar: ' + result.error);
            }
        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setIsSavingSync(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value).replace(/\s/g, '');
    };

    const handleCopyText = async (employeeId: string) => {
        const emp = employees.find(e => e.id === employeeId);
        if (!emp) return;

        const data = paymentData[employeeId] || { faltas: 0, salarioBase: emp.salario, extras: 0, vales: 0, salaofestas: 0 };
        const base = data.salarioBase;
        const discountFaltas = (base / 30) * data.faltas;
        const extrasTotal = (data.extras || 0) + (data.salaofestas || 0);
        const vales = data.vales || 0;
        
        const total = Math.max(0, base - discountFaltas + extrasTotal - vales);

        const text = `${emp.nome}\n\nSalario:${formatCurrency(base)}\nExtras:${formatCurrency(extrasTotal)}\nFaltas:${formatCurrency(discountFaltas)}\nvales:${formatCurrency(vales)}\n\nTOTAL:${formatCurrency(total)}`;
        
        try {
            await navigator.clipboard.writeText(text);
            alert(`Texto copiado com sucesso para ${emp.nome}!`);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Erro ao copiar texto.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-8 h-8 text-indigo-400" />
                            Gerador de Holerites
                        </div>
                        
                        {holidays.length > 0 && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowHolidays(!showHolidays)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-lg shrink-0 ${showHolidays ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{holidays.length} Feriados</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showHolidays ? 'rotate-180' : ''}`} />
                                </button>

                                {showHolidays && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowHolidays(false)} />
                                        <div className="absolute top-full mt-2 left-0 z-20 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl min-w-[240px] animate-in zoom-in-95 fade-in duration-200">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Feriados {MONTHS[selectedMonth-1]}
                                            </p>
                                            <div className="space-y-3">
                                                {holidays.map((h, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="bg-amber-500 text-slate-950 font-black text-[11px] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                                            {h.day}
                                                        </div>
                                                        <span className="text-xs text-slate-200 font-bold uppercase tracking-tight">{h.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere recibos de pagamento com cálculo automático de faltas.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
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
                                    {monthlyFuncs.some(mf => mf.funcionarioId === emp.id) && (
                                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            Na Planilha: {MONTHS[selectedMonth-1]}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-xs font-mono">{formatCurrency(paymentData[emp.id!]?.salarioBase || emp.salario)}</p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCopyText(emp.id!); }}
                                        className="text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/50 p-1.5 rounded"
                                        title="Copiar Texto"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {selectedEmployeeRecord ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-emerald-400" /> Configuração do Pagamento
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Salário Base (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.salario || ''}
                                            onChange={(e) => handleSalaryChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-red-400 font-bold focus:ring-2 focus:ring-rose-500/50 outline-none"
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
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-red-400 font-bold focus:ring-2 focus:ring-rose-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Extras (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.extras || ''}
                                            onChange={(e) => handleExtrasChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-red-400 font-bold focus:ring-2 focus:ring-rose-500/50 outline-none"
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Vales (R$)</label>
                                        <input
                                            type="number"
                                            value={selectedEmployeeRecord.vales || ''}
                                            onChange={(e) => handleValesChange(selectedEmployeeRecord.id!, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700/50 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
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
                                        <p className="text-sm font-bold text-emerald-400">+{formatCurrency(selectedEmployeeRecord.extras + selectedEmployeeRecord.salaofestas)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Vales</p>
                                        <p className="text-sm font-bold text-amber-400">-{formatCurrency(selectedEmployeeRecord.vales)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Total Líquido</p>
                                        <p className="text-sm font-bold text-indigo-400">{formatCurrency(selectedEmployeeRecord.totalLiquido)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleCopyText(selectedEmployeeRecord.id!)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Copy className="w-4 h-4" /> Copiar Texto do Holerite
                                </button>

                                {selectedEmployeeRecord && (
                                    <div className="mt-6 flex flex-col gap-3">
                                        {(() => {
                                            const mFunc = monthlyFuncs.find(mf => mf.funcionarioId === selectedEmployeeId);
                                            if (!mFunc) return null;

                                            const isDifferent = 
                                                mFunc.valorPago !== (paymentData[selectedEmployeeId!]?.salarioBase || selectedEmployeeRecord.salario) ||
                                                mFunc.horasExtras !== (paymentData[selectedEmployeeId!]?.extras || 0);

                                            return (
                                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronização: {MONTHS[selectedMonth-1]}</p>
                                                        {isDifferent ? (
                                                            <span className="text-[10px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Diferente da Planilha</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Sincronizado</span>
                                                        )}
                                                    </div>

                                                    {isDifferent && (
                                                        <button
                                                            onClick={() => handleSaveToFinance(selectedEmployeeId!, mFunc.id)}
                                                            disabled={isSavingSync === selectedEmployeeId}
                                                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                                                        >
                                                            {isSavingSync === selectedEmployeeId ? 'Salvando...' : 'Atualizar na Planilha Financeira'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl p-16 text-center space-y-4">
                            <Users className="w-12 h-12 text-slate-700 mx-auto" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Selecione um Funcionário</h3>
                            <p className="text-slate-500 text-xs max-w-[240px] mx-auto leading-relaxed">Clique em um colaborador na lista ao lado para gerar o holerite.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* O Holerite Impresso foi removido em favor do botão de copiar para área de transferência */}

            <style dangerouslySetInnerHTML={{
                __html: `
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
