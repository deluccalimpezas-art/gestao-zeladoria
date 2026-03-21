'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Wallet, 
    Plus, 
    Trash2, 
    Edit2, 
    Search, 
    Calendar, 
    Filter,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    CreditCard,
    DollarSign,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronUp,
    Clock,
    Layers,
    ShoppingCart,
    Tag,
    ArrowRight
} from 'lucide-react';
import { 
    PersonalFinanceMonthData, 
    PersonalFixedExpenseData, 
    PersonalCreditCardExpenseData 
} from '@/modelsFinance';
import { 
    getPersonalFinanceData, 
    upsertPersonalFixedExpense, 
    upsertPersonalCreditCardExpense, 
    addPersonalRecurringExpense,
    deletePersonalFixedExpense,
    deletePersonalCreditCardExpense
} from '../../app/actions';
import { Modal } from './Modal';

export function PersonalFinanceView() {
    const [data, setData] = useState<PersonalFinanceMonthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    
    const [editingFixed, setEditingFixed] = useState<PersonalFixedExpenseData | null>(null);
    const [editingCard, setEditingCard] = useState<PersonalCreditCardExpenseData | null>(null);

    const [fixedFormData, setFixedFormData] = useState({
        name: '',
        value: '' as string | number,
        dueDate: 5,
        paid: false
    });

    const [cardFormData, setCardFormData] = useState({
        cardName: 'Principal',
        description: '',
        value: '' as string | number,
        category: 'Outros',
        paid: false
    });

    const [recurringFormData, setRecurringFormData] = useState({
        cardName: 'Principal',
        description: '',
        value: '' as string | number,
        totalInstallments: 1,
        category: 'Outros'
    });

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const categories = ['Mercado', 'Restaurante', 'Gasolina', 'Farmácia', 'Lazer', 'Outros'];

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getPersonalFinanceData(selectedMonth, selectedYear);
        if (res.success) {
            setData(res.data);
        }
        setLoading(false);
    };

    // Grouping Logic
    const groupedExpenses = useMemo(() => {
        if (!data) return [];
        
        let allFixed = data.fixedExpenses.map(e => ({ ...e, _rowType: 'FIXED' as const, _uniqueId: `fixed-${e.id}` }));
        let allCard = data.cardExpenses.map(e => ({ ...e, _rowType: 'CARD' as const, _uniqueId: `card-${e.id}` }));

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            allFixed = allFixed.filter(e => e.name.toLowerCase().includes(lowSearch));
            allCard = allCard.filter(e => e.description.toLowerCase().includes(lowSearch) || e.cardName.toLowerCase().includes(lowSearch));
        }

        const groups = [];

        // Fixed Group
        if (allFixed.length > 0) {
            groups.push({
                id: 'fixed-group',
                label: 'Contas Fixas',
                type: 'FIXED',
                icon: <Clock className="w-4 h-4 text-amber-500" />,
                items: allFixed
            });
        }

        // Card Groups
        const cardMap: Record<string, any[]> = {};
        allCard.forEach(e => {
            const name = e.cardName || 'Principal';
            if (!cardMap[name]) cardMap[name] = [];
            cardMap[name].push(e);
        });

        Object.entries(cardMap).forEach(([name, items]) => {
            groups.push({
                id: `card-group-${name}`,
                label: `Cartão: ${name}`,
                type: 'CARD',
                icon: <CreditCard className="w-4 h-4 text-indigo-400" />,
                items
            });
        });

        return groups;
    }, [data, searchTerm]);

    const stats = useMemo(() => {
        if (!data) return { fixed: 0, card: 0, total: 0 };
        const fixed = data.fixedExpenses.reduce((acc, e) => acc + e.value, 0);
        const card = data.cardExpenses.reduce((acc, e) => acc + e.value, 0);
        return { fixed, card, total: fixed + card };
    }, [data]);

    const changeMonth = (delta: number) => {
        let newMonth = selectedMonth + delta;
        let newYear = selectedYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    const handleSaveFixed = async () => {
        const val = Number(fixedFormData.value);
        if (!fixedFormData.name || val <= 0) return alert("Preencha nome e valor.");
        const res = await upsertPersonalFixedExpense({
            ...fixedFormData,
            value: val,
            id: editingFixed?.id,
            monthId: data?.id
        });
        if (res.success) {
            setIsFixedModalOpen(false);
            fetchData();
        }
    };

    const handleSaveCard = async () => {
        const val = Number(cardFormData.value);
        if (!cardFormData.description || val <= 0 || !cardFormData.cardName) return alert("Preencha descrição, valor e nome do cartão.");
        const res = await upsertPersonalCreditCardExpense({
            ...cardFormData,
            value: val,
            id: editingCard?.id,
            monthId: data?.id,
            isInstallment: false
        });
        if (res.success) {
            setIsCardModalOpen(false);
            fetchData();
        }
    };

    const handleSaveRecurring = async () => {
        const val = Number(recurringFormData.value);
        if (!recurringFormData.description || val <= 0 || recurringFormData.totalInstallments <= 0 || !recurringFormData.cardName) {
            return alert("Preencha todos os campos corretamente.");
        }
        const res = await addPersonalRecurringExpense({
            ...recurringFormData,
            value: val,
            month: selectedMonth,
            year: selectedYear
        });
        if (res.success) {
            setIsRecurringModalOpen(false);
            fetchData();
        }
    };

    const togglePaid = async (exp: any) => {
        if (exp._rowType === 'FIXED') {
            await upsertPersonalFixedExpense({ ...exp, paid: !exp.paid });
        } else {
            await upsertPersonalCreditCardExpense({ ...exp, paid: !exp.paid });
        }
        fetchData();
    };

    const handleDelete = async (exp: any) => {
        if (exp._rowType === 'FIXED') {
            if (confirm("Excluir conta fixa?")) {
                await deletePersonalFixedExpense(exp.id);
                fetchData();
            }
        } else {
            let deleteAll = false;
            if (exp.isInstallment) {
                deleteAll = confirm("Deseja excluir TODAS as parcelas deste grupo? (OK para todas, Cancelar para apenas esta)");
            } else {
                if (!confirm("Excluir gasto do cartão?")) return;
            }
            await deletePersonalCreditCardExpense(exp.id, deleteAll);
            fetchData();
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Planilha Financeira...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                            <Layers className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Planilha Financeira</h1>
                            <p className="text-sm text-slate-400 font-medium">Visão unificada de gastos e contas</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden shadow-inner">
                            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-6 py-2 text-center min-w-[140px]">
                                <span className="text-sm font-black text-white uppercase tracking-widest">{months[selectedMonth - 1]}</span>
                                <span className="block text-[10px] text-slate-500 font-bold">{selectedYear}</span>
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="h-10 w-[2px] bg-slate-700 mx-2 hidden md:block" />

                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setEditingFixed(null);
                                    setFixedFormData({ name: '', value: '', dueDate: 5, paid: false });
                                    setIsFixedModalOpen(true);
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-600 shadow-lg"
                            >
                                + FIXA
                            </button>
                            <button 
                                onClick={() => {
                                    setEditingCard(null);
                                    setCardFormData({ cardName: cardFormData.cardName || 'Principal', description: '', value: '', category: 'Outros', paid: false });
                                    setIsCardModalOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-indigo-400/30 shadow-lg shadow-indigo-600/20"
                            >
                                + CARTÃO
                            </button>
                            <button 
                                onClick={() => {
                                    setRecurringFormData({ cardName: recurringFormData.cardName || 'Principal', description: '', value: '', totalInstallments: 1, category: 'Outros' });
                                    setIsRecurringModalOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-400/30 shadow-lg shadow-emerald-600/20"
                            >
                                + PARCELA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-header with Search and Totals */}
                <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar na planilha..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                        />
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-6 py-3 bg-slate-900/40 rounded-2xl border border-slate-700/30 text-center">
                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none mb-1">Total</p>
                            <p className="text-lg font-black text-white leading-none">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Unified Spreadsheet */}
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-700">
                                <th className="px-6 py-4 w-16 text-center">Pago</th>
                                <th className="px-6 py-4 w-32">Data / Tipo</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 w-32 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {groupedExpenses.map((group) => (
                                <React.Fragment key={group.id}>
                                    {/* Group Header */}
                                    <tr className="bg-slate-900/40 border-y border-slate-700/50">
                                        <td colSpan={5} className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                {group.icon}
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{group.label}</span>
                                                <div className="flex-1 h-[1px] bg-slate-700/30 ml-2" />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{group.items.length} itens</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Group Items */}
                                    {group.items.map((exp: any) => (
                                        <React.Fragment key={exp._uniqueId}>
                                            <tr 
                                                className={`group hover:bg-slate-700/30 transition-all cursor-pointer ${expandedRow === exp._uniqueId ? 'bg-slate-700/20' : ''}`}
                                                onClick={() => setExpandedRow(expandedRow === exp._uniqueId ? null : exp._uniqueId)}
                                            >
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => togglePaid(exp)} className="inline-flex transition-transform hover:scale-110 active:scale-95">
                                                        {exp.paid ? (
                                                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center hover:border-amber-400 transition-colors">
                                                                <div className="w-1 h-1 bg-slate-800 rounded-full" />
                                                            </div>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                            {exp._rowType === 'FIXED' ? `Dia ${exp.dueDate}` : 'Lançamento'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${exp._rowType === 'FIXED' ? 'bg-amber-500/10 text-amber-500' : (exp.isInstallment ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400')}`}>
                                                                {exp._rowType === 'FIXED' ? 'Fixa' : (exp.isInstallment ? 'Parcela' : 'À Vista')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-white uppercase tracking-tight">
                                                            {exp.name || exp.description}
                                                        </span>
                                                        {exp.isInstallment && (
                                                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
                                                                <span className="text-[9px] font-black text-slate-400">
                                                                    {exp.currentInstallment}/{exp.totalInstallments}
                                                                </span>
                                                                <Layers className="w-2.5 h-2.5 text-emerald-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-base font-black ${exp.paid ? 'text-slate-400 line-through' : 'text-slate-50'}`}>
                                                        R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {exp._rowType === 'FIXED' ? (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingFixed(exp);
                                                                    setFixedFormData({ name: exp.name, value: exp.value, dueDate: exp.dueDate, paid: exp.paid });
                                                                    setIsFixedModalOpen(true);
                                                                }}
                                                                className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        ) : !exp.isInstallment && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingCard(exp);
                                                                    setCardFormData({ 
                                                                        cardName: exp.cardName || 'Principal',
                                                                        description: exp.description, 
                                                                        value: exp.value, 
                                                                        category: exp.category || 'Outros', 
                                                                        paid: exp.paid 
                                                                    });
                                                                    setIsCardModalOpen(true);
                                                                }}
                                                                className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(exp)} className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === exp._uniqueId && (
                                                <tr className="bg-slate-900/30 border-l-4 border-l-emerald-500/50 animate-in slide-in-from-left-2 duration-200">
                                                    <td colSpan={5} className="px-8 py-5">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                                    <Tag className="w-3 h-3" /> Detalhes do Lançamento
                                                                </p>
                                                                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                                                                    <div className="flex justify-between mb-2">
                                                                        <span className="text-xs text-slate-500 font-bold">Tipo</span>
                                                                        <span className="text-xs font-black text-white uppercase tracking-tighter">{exp._rowType === 'FIXED' ? 'Conta Fixa' : 'Gasto em Cartão'}</span>
                                                                    </div>
                                                                    {exp.cardName && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-xs text-slate-500 font-bold">Cartão</span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <CreditCard className="w-3 h-3 text-indigo-400" />
                                                                                <span className="text-xs font-black text-white uppercase">{exp.cardName}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                                    <Filter className="w-3 h-3" /> Categorização
                                                                </p>
                                                                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                                                            <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-black text-white uppercase tracking-tight">{exp.category || 'Geral'}</p>
                                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Grupo de Despesa</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {exp._rowType === 'CARD' && (
                                                                <div className="space-y-4">
                                                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                                        <Layers className="w-3 h-3" /> Fluxo de Pagamento
                                                                    </p>
                                                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                                                                        {exp.isInstallment ? (
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-xs text-slate-500 font-bold uppercase">Parcelas</span>
                                                                                    <span className="text-xs font-black text-emerald-400">{exp.currentInstallment} / {exp.totalInstallments}</span>
                                                                                </div>
                                                                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50 p-[1px]">
                                                                                    <div 
                                                                                        className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40 transition-all duration-1000" 
                                                                                        style={{ width: `${(exp.currentInstallment / exp.totalInstallments) * 100}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-xl">
                                                                                <DollarSign className="w-4 h-4" />
                                                                                <span className="text-[10px] font-black uppercase tracking-widest">Pagamento Integraizado</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                            {groupedExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <ShoppingCart className="w-12 h-12 text-slate-500" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nenhum lançamento encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isFixedModalOpen} onClose={() => setIsFixedModalOpen(false)} title="Lançamento - Conta Fixa">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição</label>
                        <input 
                            type="text" 
                            placeholder="Aluguel, Luz, etc..." 
                            value={fixedFormData.name}
                            onChange={e => setFixedFormData({...fixedFormData, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor (R$)</label>
                            <input 
                                type="number" 
                                value={fixedFormData.value}
                                onChange={e => setFixedFormData({...fixedFormData, value: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vencimento (Dia)</label>
                            <select 
                                value={fixedFormData.dueDate}
                                onChange={e => setFixedFormData({...fixedFormData, dueDate: Number(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSaveFixed} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                        {editingFixed ? "Salvar Alterações" : "Adicionar à Planilha"}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title="Lançamento - Cartão à Vista">
                <div className="space-y-4 p-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qual o Cartão?</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Santander, Nubank..." 
                                value={cardFormData.cardName}
                                onChange={e => setCardFormData({...cardFormData, cardName: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Onde gastou?</label>
                            <input 
                                type="text" 
                                placeholder="Mercado, Lanche, etc..." 
                                value={cardFormData.description}
                                onChange={e => setCardFormData({...cardFormData, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor (R$)</label>
                            <input 
                                type="number" 
                                value={cardFormData.value}
                                onChange={e => setCardFormData({...cardFormData, value: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                            <select 
                                value={cardFormData.category}
                                onChange={e => setCardFormData({...cardFormData, category: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSaveCard} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
                        {editingCard ? "Salvar Alterações" : "Lançar Gasto"}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} title="Lançamento - Parcelamento">
                <div className="space-y-4 p-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qual o Cartão?</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Santander, Nubank..." 
                                value={recurringFormData.cardName}
                                onChange={e => setRecurringFormData({...recurringFormData, cardName: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição da Compra</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Novo Smartphone..." 
                                value={recurringFormData.description}
                                onChange={e => setRecurringFormData({...recurringFormData, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor da Parcela (R$)</label>
                            <input 
                                type="number" 
                                value={recurringFormData.value}
                                onChange={e => setRecurringFormData({...recurringFormData, value: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nº Parcelas</label>
                            <input 
                                type="number" 
                                value={recurringFormData.totalInstallments}
                                onChange={e => setRecurringFormData({...recurringFormData, totalInstallments: Number(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                    </div>
                    <button onClick={handleSaveRecurring} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                        Gerar Parcelas Mensais
                    </button>
                </div>
            </Modal>
        </div>
    );
}
