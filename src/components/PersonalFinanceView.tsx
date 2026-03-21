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
    LayoutDashboard,
    Home,
    CreditCard as CardIcon,
    ArrowLeft,
    HandCoins,
    Navigation,
    Utensils,
    Fuel,
    ShoppingBag
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

type ActiveTab = 'dashboard' | 'cards';

export function PersonalFinanceView() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    
    const [data, setData] = useState<PersonalFinanceMonthData | null>(null);
    const [cards, setCards] = useState<PersonalCreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    
    // Modals
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // Used for both cash and recurring within card view
    
    const [editingFixed, setEditingFixed] = useState<PersonalFixedExpenseData | null>(null);

    // Form Data
    const [fixedFormData, setFixedFormData] = useState({
        name: '',
        value: '' as string | number,
        dueDate: 5,
        paid: false
    });

    const [newCardName, setNewCardName] = useState('');

    const [expenseFormData, setExpenseFormData] = useState({
        type: 'CASH' as 'CASH' | 'RECURRING',
        description: '',
        value: '' as string | number,
        totalInstallments: 1,
        category: 'Outros',
        totalValue: 0 // Visual only or for calculation
    });

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const categories = [
        { id: 'Mercado', icon: <ShoppingBag className="w-4 h-4" /> },
        { id: 'Restaurante', icon: <Utensils className="w-4 h-4" /> },
        { id: 'Gasolina', icon: <Fuel className="w-4 h-4" /> },
        { id: 'Outros', icon: <Plus className="w-4 h-4" /> }
    ];

    useEffect(() => {
        fetchData();
        fetchCards();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getPersonalFinanceData(selectedMonth, selectedYear);
        if (res.success) setData(res.data);
        setLoading(false);
    };

    const fetchCards = async () => {
        const res = await getPersonalCards();
        if (res.success) setCards(res.data);
    };

    const changeMonth = (delta: number) => {
        let nm = selectedMonth + delta;
        let ny = selectedYear;
        if (nm > 12) { nm = 1; ny++; }
        else if (nm < 1) { nm = 12; ny--; }
        setSelectedMonth(nm);
        setSelectedYear(ny);
    };

    // Dashboard Data Calculation
    const allExpenses = useMemo(() => {
        if (!data) return [];
        const fixed = data.fixedExpenses.map(e => ({ ...e, _type: 'FIXED', _id: `f-${e.id}` }));
        const cardsArr = data.cardExpenses.map(e => ({ ...e, _type: 'CARD', _id: `c-${e.id}` }));
        let combined = [...fixed, ...cardsArr];
        
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            combined = combined.filter((e: any) => 
                (e.name || e.description || '').toLowerCase().includes(low) ||
                (e.cardName || '').toLowerCase().includes(low)
            );
        }
        return combined.sort((a, b) => (a.paid === b.paid ? 0 : a.paid ? 1 : -1));
    }, [data, searchTerm]);

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

    const stats = useMemo(() => {
        if (!data) return { total: 0, paid: 0, pending: 0 };
        const total = [...data.fixedExpenses, ...data.cardExpenses].reduce((acc, e) => acc + e.value, 0);
        const paid = [...data.fixedExpenses, ...data.cardExpenses].filter(e => e.paid).reduce((acc, e) => acc + e.value, 0);
        return { total, paid, pending: total - paid };
    }, [data]);

    // Card Specific Handlers
    const handleAddCard = async () => {
        if (!newCardName) return;
        const res = await upsertPersonalCard({ name: newCardName });
        if (res.success) {
            setNewCardName('');
            setIsAddCardModalOpen(false);
            fetchCards();
        }
    };

    const handleSaveExpense = async () => {
        if (!selectedCardId || !expenseFormData.description || Number(expenseFormData.value) <= 0) {
            return alert("Preencha descrição e valor.");
        }
        
        const card = cards.find(c => c.id === selectedCardId);
        if (!card) return;

        if (expenseFormData.type === 'CASH') {
            const res = await upsertPersonalCreditCardExpense({
                cardId: card.id,
                cardName: card.name,
                description: expenseFormData.description,
                value: Number(expenseFormData.value),
                category: expenseFormData.category,
                monthId: data?.id,
                isInstallment: false
            });
            if (res.success) {
                setIsExpenseModalOpen(false);
                fetchData();
            }
        } else {
            const res = await addPersonalRecurringExpense({
                cardId: card.id,
                cardName: card.name,
                description: expenseFormData.description,
                value: Number(expenseFormData.value),
                totalInstallments: expenseFormData.totalInstallments,
                category: expenseFormData.category,
                month: selectedMonth,
                year: selectedYear
            });
            if (res.success) {
                setIsExpenseModalOpen(false);
                fetchData();
            }
        }
    };

    const togglePaid = async (exp: any) => {
        if (exp._type === 'FIXED') {
            await upsertPersonalFixedExpense({ ...exp, paid: !exp.paid });
        } else {
            await upsertPersonalCreditCardExpense({ ...exp, paid: !exp.paid });
        }
        fetchData();
    };

    const handleDelete = async (exp: any) => {
        if (!confirm("Excluir este lançamento?")) return;
        if (exp._type === 'FIXED') {
            await deletePersonalFixedExpense(exp.id);
        } else {
            await deletePersonalCreditCardExpense(exp.id, exp.isInstallment && confirm("Excluir todas as parcelas futuras também?"));
        }
        fetchData();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Main Navigation */}
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700/50 w-fit mx-auto shadow-xl">
                <button 
                    onClick={() => { setActiveTab('dashboard'); setSelectedCardId(null); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Home className="w-4 h-4" /> Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('cards')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'cards' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <CardIcon className="w-4 h-4" /> Meus Cartões
                </button>
            </div>

            {/* Content Control Bar */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                        <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-900 text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                        <div className="px-6 py-2 text-center min-w-[140px]">
                            <span className="text-sm font-black text-white uppercase tracking-widest leading-none">{months[selectedMonth-1]}</span>
                            <span className="block text-[10px] text-slate-500 font-bold leading-none mt-1">{selectedYear}</span>
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-900 text-slate-500 transition-colors"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="hidden md:flex gap-4">
                        <div className="px-4 py-2 bg-slate-950/40 rounded-xl border border-slate-800/50">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Gasto</p>
                            <p className="text-sm font-black text-white">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-0.5">Total Pago</p>
                            <p className="text-sm font-black text-white">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {activeTab === 'dashboard' ? (
                        <button 
                            onClick={() => { setEditingFixed(null); setFixedFormData({ name: '', value: '', dueDate: 5, paid: false }); setIsFixedModalOpen(true); }}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-600 shadow-xl"
                        >
                            + NOVA CONTA FIXA
                        </button>
                    ) : !selectedCardId && (
                        <button 
                            onClick={() => { setNewCardName(''); setIsAddCardModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-indigo-400/30 shadow-xl shadow-indigo-600/20"
                        >
                            + ADICIONAR CARTÃO
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar em todos os gastos do mês..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner backdrop-blur-md"
                        />
                    </div>

                    <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-700/50">
                                    <th className="px-6 py-4 w-16 text-center">Status</th>
                                    <th className="px-6 py-4">Lançamento / Origem</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/20">
                                {allExpenses.map((exp: any) => (
                                    <tr key={exp._id} className="group hover:bg-slate-700/20 transition-all">
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => togglePaid(exp)} className="transition-transform active:scale-90">
                                                {exp.paid ? (
                                                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 bg-slate-900 border-2 border-slate-800 rounded-lg" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white uppercase tracking-tight">{exp.name || exp.description}</span>
                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                    {exp._type === 'FIXED' ? `Pra vencer dia ${exp.dueDate}` : `Cartão ${exp.cardName}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${exp._type === 'FIXED' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                    {exp._type === 'FIXED' ? 'Fixa' : (exp.isInstallment ? 'Parcelado' : 'À Vista')}
                                                </span>
                                                {exp._type === 'CARD' && exp.isInstallment && (
                                                    <span className="text-[9px] font-black text-slate-500">{exp.currentInstallment}/{exp.totalInstallments}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-base font-black ${exp.paid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                                R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(exp)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-400 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {allExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center opacity-30">
                                            <LayoutDashboard className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                                            <p className="text-xs font-black uppercase tracking-widest">Nenhum gasto registrado este mês</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MAIN VIEW: CARDS */}
            {activeTab === 'cards' && !selectedCardId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {cards.map(card => {
                        const cardSpend = data?.cardExpenses.filter(e => e.cardId === card.id).reduce((acc, e) => acc + e.value, 0) || 0;
                        return (
                            <div 
                                key={card.id} 
                                onClick={() => setSelectedCardId(card.id)}
                                className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group hover:bg-slate-800/60 shadow-xl"
                            >
                                <div className="flex justify-between items-start mb-12">
                                    <div className="w-12 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg border border-white/10" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(confirm("Excluir cartão?")) { deletePersonalCard(card.id).then(fetchCards); } }}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-lg text-slate-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{card.name}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Gasto neste mês</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-black text-indigo-300">R$ {cardSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {cards.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-700 text-center opacity-40">
                             <Plus className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                             <p className="text-xs font-black uppercase tracking-widest">Adicione seu primeiro cartão para começar</p>
                        </div>
                    )}
                </div>
            )}

            {/* CARD WORK AREA / DETAILS */}
            {activeTab === 'cards' && selectedCardId && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedCardId(null)}
                            className="p-3 hover:bg-slate-800 rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{cards.find(c => c.id === selectedCardId)?.name}</h2>
                            <p className="text-xs text-slate-500 font-bold">Lançamentos específicos deste cartão</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setExpenseFormData({ ...expenseFormData, type: 'CASH', totalInstallments: 1 }); setIsExpenseModalOpen(true); }}
                            className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/50 hover:bg-slate-700/40 transition-all group flex flex-col items-center gap-4 shadow-xl"
                        >
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-black text-white uppercase tracking-widest block">Gastos à Vista</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Mercado, Gasolina, Refeições, etc</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => { setExpenseFormData({ ...expenseFormData, type: 'RECURRING', totalInstallments: 10 }); setIsExpenseModalOpen(true); }}
                            className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/50 hover:bg-slate-700/40 transition-all group flex flex-col items-center gap-4 shadow-xl"
                        >
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                                <Clock className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-black text-white uppercase tracking-widest block">Gastos Recorrentes</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Parcelamentos e Compras Futuras</span>
                            </div>
                        </button>
                    </div>

                    <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y divide-slate-700/50">
                                {data?.cardExpenses.filter(e => e.cardId === selectedCardId).map(exp => (
                                    <tr key={exp.id} className="group hover:bg-slate-700/20 transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl ${exp.isInstallment ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}>
                                                    {exp.isInstallment ? <Clock className="w-4 h-4 text-emerald-500"/> : <DollarSign className="w-4 h-4 text-indigo-400"/>}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{exp.description}</span>
                                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{exp.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {exp.isInstallment ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">Parcela {exp.currentInstallment}/{exp.totalInstallments}</span>
                                                    <div className="w-24 h-1 bg-slate-900 rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${(exp.currentInstallment! / exp.totalInstallments!) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-500 uppercase">À Vista</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-100">
                                            R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button onClick={() => handleDelete(exp)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-xl text-slate-500 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS SECTION */}

            <Modal isOpen={isFixedModalOpen} onClose={() => setIsFixedModalOpen(false)} title="Nova Conta Fixa">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Descrição (ex: Aluguel)</label>
                        <input 
                            type="text" 
                            value={fixedFormData.name}
                            onChange={e => setFixedFormData({...fixedFormData, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Valor (R$)</label>
                            <input type="number" value={fixedFormData.value} onChange={e => setFixedFormData({...fixedFormData, value: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Vencimento (Dia)</label>
                            <select value={fixedFormData.dueDate} onChange={e => setFixedFormData({...fixedFormData, dueDate: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white">
                                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSaveFixed} className="w-full bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">Registrar Conta</button>
                </div>
            </Modal>

            <Modal isOpen={isAddCardModalOpen} onClose={() => setIsAddCardModalOpen(false)} title="Novo Cartão">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Nome do Cartão (ex: Santander)</label>
                        <input type="text" value={newCardName} onChange={e => setNewCardName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                    <button onClick={handleAddCard} className="w-full bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">Cadastrar Cartão</button>
                </div>
            </Modal>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title={expenseFormData.type === 'CASH' ? 'Lançamento à Vista' : 'Compras Parceladas'}>
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">O que você comprou?</label>
                        <input 
                            type="text" 
                            placeholder={expenseFormData.type === 'CASH' ? "ex: Mercado, Almoço..." : "ex: Bicicleta, Notebook..."}
                            value={expenseFormData.description}
                            onChange={e => setExpenseFormData({...expenseFormData, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" 
                        />
                    </div>
                    
                    {expenseFormData.type === 'CASH' ? (
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Categoria</label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setExpenseFormData({...expenseFormData, category: cat.id})}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${expenseFormData.category === cat.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        {cat.icon} <span className="text-[10px] font-bold uppercase">{cat.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Número de Parcelas</label>
                                <input type="number" value={expenseFormData.totalInstallments} onChange={e => setExpenseFormData({...expenseFormData, totalInstallments: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Valor da Parcela (R$)</label>
                                <input type="number" value={expenseFormData.value} onChange={e => setExpenseFormData({...expenseFormData, value: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        {expenseFormData.type === 'CASH' ? (
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Valor do Gasto (R$)</label>
                                <input type="number" value={expenseFormData.value} onChange={e => setExpenseFormData({...expenseFormData, value: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>
                        ) : (
                            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/50">
                                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                    <span>Valor Total da Compra</span>
                                    <span className="text-emerald-500">Auto-Projetado</span>
                                </div>
                                <p className="text-2xl font-black text-white">R$ {(Number(expenseFormData.value) * expenseFormData.totalInstallments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        )}
                    </div>

                    <button onClick={handleSaveExpense} className="w-full bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]">
                        Confirmar Lançamento
                    </button>
                </div>
            </Modal>
        </div>
    );
}
