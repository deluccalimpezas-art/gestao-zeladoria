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
    ArrowRight,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { 
    PersonalFinanceMonthData, 
    PersonalFixedExpenseData, 
    PersonalCreditCardExpenseData,
    PersonalCreditCard
} from '@/modelsFinance';
import { 
    getPersonalFinanceData, 
    upsertPersonalFixedExpense, 
    upsertPersonalCreditCardExpense, 
    addPersonalRecurringExpense,
    deletePersonalFixedExpense,
    deletePersonalCreditCardExpense,
    getPersonalCards,
    upsertPersonalCard,
    deletePersonalCard
} from '../../app/actions';
import { Modal } from './Modal';

export function PersonalFinanceView() {
    const [data, setData] = useState<PersonalFinanceMonthData | null>(null);
    const [cards, setCards] = useState<PersonalCreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // UI States
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [isCardManagerOpen, setIsCardManagerOpen] = useState(false);
    
    // Editing
    const [editingFixed, setEditingFixed] = useState<PersonalFixedExpenseData | null>(null);
    const [editingCard, setEditingCard] = useState<PersonalCreditCardExpenseData | null>(null);
    const [editingMasterCard, setEditingMasterCard] = useState<PersonalCreditCard | null>(null);

    // Form Data
    const [fixedFormData, setFixedFormData] = useState({
        name: '',
        value: '' as string | number,
        dueDate: 5,
        paid: false
    });

    const [cardFormData, setCardFormData] = useState({
        cardId: '',
        cardName: 'Principal',
        description: '',
        value: '' as string | number,
        category: 'Outros',
        paid: false
    });

    const [recurringFormData, setRecurringFormData] = useState({
        cardId: '',
        cardName: 'Principal',
        description: '',
        value: '' as string | number,
        totalInstallments: 1,
        category: 'Outros'
    });

    const [masterCardForm, setMasterCardForm] = useState({
        name: '',
        bank: '',
        color: '#4f46e5'
    });

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const categories = ['Mercado', 'Restaurante', 'Gasolina', 'Farmácia', 'Lazer', 'Outros'];

    useEffect(() => {
        fetchData();
        fetchCards();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getPersonalFinanceData(selectedMonth, selectedYear);
        if (res.success) {
            setData(res.data);
        }
        setLoading(false);
    };

    const fetchCards = async () => {
        const res = await getPersonalCards();
        if (res.success) setCards(res.data);
    };

    // Grouping & Summarization Logic
    const cardSummaries = useMemo(() => {
        if (!data) return [];
        
        const summaryMap: Record<string, { id: string, name: string, total: number, items: any[] }> = {};
        
        // Ensure all registered cards show up, even if zero
        cards.forEach(c => {
            summaryMap[c.id] = { id: c.id, name: c.name, total: 0, items: [] };
        });

        // Add "Principal" or Unlinked items
        const genericId = 'generic-card';
        summaryMap[genericId] = { id: genericId, name: 'Principal / Outros', total: 0, items: [] };

        data.cardExpenses.forEach(exp => {
            const cid = exp.cardId || genericId;
            if (!summaryMap[cid]) {
                summaryMap[cid] = { id: cid, name: exp.cardName || 'Principal', total: 0, items: [] };
            }
            summaryMap[cid].total += exp.value;
            summaryMap[cid].items.push({ ...exp, _rowType: 'CARD', _uniqueId: `card-${exp.id}` });
        });

        return Object.values(summaryMap).filter(s => s.total > 0 || (s.id !== genericId));
    }, [data, cards]);

    const filteredFixedExpenses = useMemo(() => {
        if (!data) return [];
        let list = data.fixedExpenses.map(e => ({ ...e, _rowType: 'FIXED' as const, _uniqueId: `fixed-${e.id}` }));
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            list = list.filter(e => e.name.toLowerCase().includes(lowSearch));
        }
        return list;
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

    // Handlers
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

    const handleSaveCardExpense = async () => {
        const val = Number(cardFormData.value);
        if (!cardFormData.description || val <= 0) return alert("Preencha descrição e valor.");
        
        // Find actual card name from ID
        const selectedCard = cards.find(c => c.id === cardFormData.cardId);
        const nameToUse = selectedCard?.name || cardFormData.cardName;

        const res = await upsertPersonalCreditCardExpense({
            ...cardFormData,
            cardName: nameToUse,
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
        if (!recurringFormData.description || val <= 0 || recurringFormData.totalInstallments <= 0) {
            return alert("Preencha todos os campos corretamente.");
        }

        const selectedCard = cards.find(c => c.id === recurringFormData.cardId);
        const nameToUse = selectedCard?.name || recurringFormData.cardName;

        const res = await addPersonalRecurringExpense({
            ...recurringFormData,
            cardName: nameToUse,
            value: val,
            month: selectedMonth,
            year: selectedYear
        });
        if (res.success) {
            setIsRecurringModalOpen(false);
            fetchData();
        }
    };

    const handleSaveMasterCard = async () => {
        if (!masterCardForm.name) return alert("Nome do cartão é obrigatório.");
        const res = await upsertPersonalCard({ ...masterCardForm, id: editingMasterCard?.id });
        if (res.success) {
            setMasterCardForm({ name: '', bank: '', color: '#4f46e5' });
            setEditingMasterCard(null);
            fetchCards();
        }
    };

    const handleDeleteMasterCard = async (id: string) => {
        if (confirm("Excluir cartão? Isso não excluirá os gastos já lançados, mas eles ficarão sem o vínculo direto.")) {
            await deletePersonalCard(id);
            fetchCards();
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

    const handleDeleteExpense = async (exp: any) => {
        if (exp._rowType === 'FIXED') {
            if (confirm("Excluir conta fixa?")) {
                await deletePersonalFixedExpense(exp.id);
                fetchData();
            }
        } else {
            let deleteAll = false;
            if (exp.isInstallment) {
                deleteAll = confirm("Deseja excluir TODAS as parcelas deste grupo?");
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Finanças...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet className="w-32 h-32 text-white" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Painel Financeiro</h1>
                            <p className="text-sm text-slate-400 font-medium capitalize">{months[selectedMonth - 1]} de {selectedYear}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden shadow-inner">
                            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-6 py-2 text-center min-w-[140px]">
                                <span className="text-sm font-black text-white uppercase tracking-widest leading-none">{months[selectedMonth - 1]}</span>
                                <span className="block text-[10px] text-slate-500 font-bold leading-none mt-1">{selectedYear}</span>
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                             <button 
                                onClick={() => setIsCardManagerOpen(true)}
                                className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-2xl transition-all border border-slate-600 shadow-lg"
                                title="Gerenciar Cartões"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
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
                                    setCardFormData({ cardId: cards[0]?.id || '', cardName: 'Principal', description: '', value: '', category: 'Outros', paid: false });
                                    setIsCardModalOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-indigo-400/30 shadow-lg shadow-indigo-600/20"
                            >
                                + GASTO
                            </button>
                            <button 
                                onClick={() => {
                                    setRecurringFormData({ cardId: cards[0]?.id || '', cardName: 'Principal', description: '', value: '', totalInstallments: 1, category: 'Outros' });
                                    setIsRecurringModalOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-400/30 shadow-lg shadow-emerald-600/20"
                            >
                                + PARCELA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700/50">
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Mês</p>
                        <p className="text-xl font-black text-white leading-none">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                        <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Contas Fixas</p>
                        <p className="text-xl font-black text-white leading-none">R$ {stats.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                        <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest mb-1">Total Cartões</p>
                        <p className="text-xl font-black text-white leading-none">R$ {stats.card.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Combined Spreadsheet Table */}
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-700">
                                <th className="px-6 py-4 w-16 text-center">Status</th>
                                <th className="px-6 py-4 w-32">Data / Tipo</th>
                                <th className="px-6 py-4">Descrição Principal</th>
                                <th className="px-6 py-4 text-right">Valor Total</th>
                                <th className="px-6 py-4 w-32 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {/* FIXED EXPENSES ROWS */}
                            <tr className="bg-slate-800/60 transition-colors">
                                <td colSpan={5} className="px-6 py-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contas Fixas Mensais</span>
                                    </div>
                                </td>
                            </tr>
                            {filteredFixedExpenses.map(exp => (
                                <tr key={exp._uniqueId} className="group hover:bg-slate-700/20 transition-all">
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => togglePaid(exp)} className="transition-transform active:scale-90">
                                            {exp.paid ? (
                                                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center hover:border-amber-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Dia {exp.dueDate}</span>
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Fixa</p>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white uppercase text-sm tracking-tight">{exp.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-base font-black ${exp.paid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                            R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setEditingFixed(exp);
                                                    setFixedFormData({ name: exp.name, value: exp.value, dueDate: exp.dueDate ?? 5, paid: exp.paid });
                                                    setIsFixedModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteExpense(exp)} className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* CARD SUMMARY ROWS OR INDIVIDUAL IF NOT LINKED */}
                            <tr className="bg-slate-800/60 transition-colors">
                                <td colSpan={5} className="px-6 py-2">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo de Cartões de Crédito</span>
                                    </div>
                                </td>
                            </tr>
                            
                            {cardSummaries.map(summary => (
                                <React.Fragment key={summary.id}>
                                    <tr 
                                        className={`cursor-pointer transition-all hover:bg-slate-700/30 ${expandedCard === summary.id ? 'bg-slate-700/20 border-l-4 border-l-indigo-500' : ''}`}
                                        onClick={() => setExpandedCard(expandedCard === summary.id ? null : summary.id)}
                                    >
                                        <td className="px-6 py-5 text-center">
                                            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                                <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${expandedCard === summary.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Cartão</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <span className="text-sm font-black text-white uppercase tracking-tight">{summary.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">{summary.items.length} lançamentos lançados</span>
                                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-0.5">Subtotal</span>
                                                <span className="text-lg font-black text-indigo-300">
                                                    R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 underline underline-offset-4 tracking-widest transition-colors">
                                                {expandedCard === summary.id ? 'Fechar' : 'Ver Tudo'}
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    {/* NESTED EXPENSES FOR THIS CARD */}
                                    {expandedCard === summary.id && summary.items.map(exp => (
                                        <tr key={exp._uniqueId} className="bg-slate-900/40 border-l border-slate-700 group animate-in slide-in-from-left duration-200">
                                            <td className="px-6 py-3 text-center">
                                                <button onClick={() => togglePaid(exp)} className="transition-transform active:scale-90">
                                                    {exp.paid ? (
                                                        <div className="w-5 h-5 bg-emerald-500/80 rounded flex items-center justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 bg-slate-800 border-2 border-slate-700 rounded" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                     <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${exp.isInstallment ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                        {exp.isInstallment ? 'Parcelado' : 'À Vista'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{exp.description}</span>
                                                    {exp.isInstallment && (
                                                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                                            {exp.currentInstallment}/{exp.totalInstallments}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`text-sm font-black ${exp.paid ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                                                    R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                 <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!exp.isInstallment && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingCard(exp);
                                                                setCardFormData({ 
                                                                    cardId: exp.cardId || '',
                                                                    cardName: exp.cardName || 'Principal',
                                                                    description: exp.description, 
                                                                    value: exp.value, 
                                                                    category: exp.category || 'Outros', 
                                                                    paid: exp.paid 
                                                                });
                                                                setIsCardModalOpen(true);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExpense(exp);
                                                        }} 
                                                        className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}

                            {cardSummaries.length === 0 && filteredFixedExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <ShoppingCart className="w-12 h-12 text-slate-500" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">A planilha está vazia para este mês</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals Section */}
            
            {/* 1. FIXED EXPENSE MODAL */}
            <Modal isOpen={isFixedModalOpen} onClose={() => setIsFixedModalOpen(false)} title="Lançamento - Conta Fixa">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição da Conta</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Aluguel, Internet..." 
                            value={fixedFormData.name}
                            onChange={e => setFixedFormData({...fixedFormData, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Mensal (R$)</label>
                            <input 
                                type="number" 
                                value={fixedFormData.value}
                                onChange={e => setFixedFormData({...fixedFormData, value: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dia do Vencimento</label>
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
                        {editingFixed ? "Atualizar Conta" : "Adicionar Lançamento"}
                    </button>
                </div>
            </Modal>

            {/* 2. CARD EXPENSE MODAL */}
            <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title="Novo Gasto no Cartão (À Vista)">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Selecione o Cartão</label>
                        <select 
                            value={cardFormData.cardId}
                            onChange={e => setCardFormData({...cardFormData, cardId: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50"
                        >
                            <option value="">Selecione um cartão cadastrado...</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="none">Outro / Principal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Onde gastou? (Origem)</label>
                        <input 
                            type="text" 
                            placeholder="Mercado, Lanche, Shopee..." 
                            value={cardFormData.description}
                            onChange={e => setCardFormData({...cardFormData, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor do Gasto (R$)</label>
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
                    <button onClick={handleSaveCardExpense} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all">
                        {editingCard ? "Salvar Alterações" : "Lançar no Cartão"}
                    </button>
                </div>
            </Modal>

            {/* 3. RECURRING EXPENSE MODAL */}
            <Modal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} title="Gerar Gastos Parcelados">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qual Cartão utilizar?</label>
                        <select 
                            value={recurringFormData.cardId}
                            onChange={e => setRecurringFormData({...recurringFormData, cardId: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        >
                            <option value="">Selecione o cartão...</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição da Compra (Origem)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Novo Smartphone Apple..." 
                            value={recurringFormData.description}
                            onChange={e => setRecurringFormData({...recurringFormData, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor da Parcela (R$)</label>
                            <input 
                                type="number" 
                                value={recurringFormData.value}
                                onChange={e => setRecurringFormData({...recurringFormData, value: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Parcelas</label>
                            <input 
                                type="number" 
                                value={recurringFormData.totalInstallments}
                                onChange={e => setRecurringFormData({...recurringFormData, totalInstallments: Number(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200" 
                            />
                        </div>
                    </div>
                    <button onClick={handleSaveRecurring} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/40">
                        Projetar Parcelas Mensais
                    </button>
                </div>
            </Modal>

            {/* 4. CARD MANAGER MODAL */}
            <Modal isOpen={isCardManagerOpen} onClose={() => setIsCardManagerOpen(false)} title="Gerenciador de Cartões">
                <div className="space-y-6 p-2">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 space-y-4">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-3 h-3" /> {editingMasterCard ? 'Editar Cartão' : 'Cadastrar Novo Cartão'}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Nome (Ex: Nubank)" 
                                value={masterCardForm.name}
                                onChange={e => setMasterCardForm({...masterCardForm, name: e.target.value})}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                            />
                            <input 
                                type="text" 
                                placeholder="Banco (Ex: Digital)" 
                                value={masterCardForm.bank}
                                onChange={e => setMasterCardForm({...masterCardForm, bank: e.target.value})}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Cor do Cartão</label>
                                <input 
                                    type="color" 
                                    value={masterCardForm.color}
                                    onChange={e => setMasterCardForm({...masterCardForm, color: e.target.value})}
                                    className="w-full h-8 cursor-pointer rounded-lg bg-transparent border-none"
                                />
                            </div>
                            <button onClick={handleSaveMasterCard} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-10 rounded-xl text-[10px] font-black uppercase transition-all self-end">
                                {editingMasterCard ? 'Salvar' : 'Cadastrar'}
                            </button>
                            {editingMasterCard && (
                                <button onClick={() => { setEditingMasterCard(null); setMasterCardForm({ name: '', bank: '', color: '#4f46e5' }); }} className="bg-slate-700 px-4 h-10 rounded-xl text-[10px] font-black uppercase text-white self-end">
                                    X
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cartões Ativos</p>
                         <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                            {cards.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-5 rounded" style={{ backgroundColor: c.color || '#4f46e5' }} />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase">{c.name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">{c.bank || 'Banco Geral'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingMasterCard(c); setMasterCardForm({ name: c.name, bank: c.bank || '', color: c.color || '#4f46e5' }); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDeleteMasterCard(c.id)} className="p-1.5 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
