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
    Clock
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
    
    const [activeCardTab, setActiveCardTab] = useState<'vista' | 'recorrente'>('vista');
    const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
    
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    
    const [editingFixed, setEditingFixed] = useState<PersonalFixedExpenseData | null>(null);
    const [editingCard, setEditingCard] = useState<PersonalCreditCardExpenseData | null>(null);

    const [fixedFormData, setFixedFormData] = useState({
        name: '',
        value: 0,
        dueDate: 5,
        paid: false
    });

    const [cardFormData, setCardFormData] = useState({
        description: '',
        value: 0,
        category: 'Outros',
        paid: false
    });

    const [recurringFormData, setRecurringFormData] = useState({
        description: '',
        value: 0,
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
        if (!fixedFormData.name || fixedFormData.value <= 0) return alert("Preencha nome e valor.");
        const res = await upsertPersonalFixedExpense({
            ...fixedFormData,
            id: editingFixed?.id,
            monthId: data?.id
        });
        if (res.success) {
            setIsFixedModalOpen(false);
            fetchData();
        }
    };

    const handleSaveCard = async () => {
        if (!cardFormData.description || cardFormData.value <= 0) return alert("Preencha descrição e valor.");
        const res = await upsertPersonalCreditCardExpense({
            ...cardFormData,
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
        if (!recurringFormData.description || recurringFormData.value <= 0 || recurringFormData.totalInstallments <= 0) {
            return alert("Preencha todos os campos corretamente.");
        }
        const res = await addPersonalRecurringExpense({
            ...recurringFormData,
            month: selectedMonth,
            year: selectedYear
        });
        if (res.success) {
            setIsRecurringModalOpen(false);
            fetchData();
        }
    };

    const toggleFixedPaid = async (expense: PersonalFixedExpenseData) => {
        await upsertPersonalFixedExpense({ ...expense, paid: !expense.paid });
        fetchData();
    };

    const toggleCardPaid = async (expense: PersonalCreditCardExpenseData) => {
        await upsertPersonalCreditCardExpense({ ...expense, paid: !expense.paid });
        fetchData();
    };

    const handleDeleteFixed = async (id: string) => {
        if (confirm("Excluir conta fixa?")) {
            await deletePersonalFixedExpense(id);
            fetchData();
        }
    };

    const handleDeleteCard = async (id: string, isRecurring: boolean) => {
        let deleteAll = false;
        if (isRecurring) {
            deleteAll = confirm("Deseja excluir TODAS as parcelas deste grupo? (OK para todas, Cancelar para apenas esta)");
        } else {
            if (!confirm("Excluir gasto do cartão?")) return;
        }
        await deletePersonalCreditCardExpense(id, deleteAll);
        fetchData();
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Gestão Pessoal...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                        <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Gestão Financeira Pessoal</h1>
                        <p className="text-sm text-slate-400 font-medium">Controle de despesa e contas mensais</p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden shadow-inner">
                    <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 py-2 text-center min-w-[160px]">
                        <span className="text-sm font-bold text-white uppercase tracking-widest">{months[selectedMonth - 1]}</span>
                        <span className="block text-[10px] text-slate-500 font-black">{selectedYear}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-3xl border border-slate-700/50 shadow-xl">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Contas Fixas</p>
                    <p className="text-3xl font-black text-white">R$ {stats.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-3xl border border-slate-700/50 shadow-xl">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Cartão de Crédito</p>
                    <p className="text-3xl font-black text-white">R$ {stats.card.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 p-6 rounded-3xl border border-indigo-500/30 shadow-xl">
                    <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-1">Total do Mês</p>
                    <p className="text-3xl font-black text-white">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contas Fixas */}
                <section className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            CONTAS FIXAS
                        </h2>
                        <button 
                            onClick={() => {
                                setEditingFixed(null);
                                setFixedFormData({ name: '', value: 0, dueDate: 5, paid: false });
                                setIsFixedModalOpen(true);
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-xl transition-all"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="px-4 py-3">Conta</th>
                                    <th className="px-4 py-3">Venc.</th>
                                    <th className="px-4 py-3">Valor</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {data?.fixedExpenses.map(exp => (
                                    <tr key={exp.id} className="group hover:bg-slate-700/20 transition-colors">
                                        <td className="px-4 py-4 text-sm font-bold text-white uppercase tracking-tight">{exp.name}</td>
                                        <td className="px-4 py-4 text-sm text-slate-400 font-bold">Dia {exp.dueDate}</td>
                                        <td className="px-4 py-4 text-sm font-black text-slate-200">R$ {exp.value.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => toggleFixedPaid(exp)} className="inline-flex">
                                                {exp.paid ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-slate-600 hover:text-amber-400 transition-colors" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => {
                                                        setEditingFixed(exp);
                                                        setFixedFormData({ name: exp.name, value: exp.value, dueDate: exp.dueDate || 5, paid: exp.paid });
                                                        setIsFixedModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteFixed(exp.id!)} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.fixedExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhuma conta fixa</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Cartão de Crédito */}
                <section className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-2xl flex flex-col">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                                CARTÃO DE CRÉDITO
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        setEditingCard(null);
                                        setCardFormData({ description: '', value: 0, category: 'Outros', paid: false });
                                        setIsCardModalOpen(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    + À VISTA
                                </button>
                                <button 
                                    onClick={() => {
                                        setRecurringFormData({ description: '', value: 0, totalInstallments: 1, category: 'Outros' });
                                        setIsRecurringModalOpen(true);
                                    }}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    + PARCELADO
                                </button>
                            </div>
                        </div>
                        <div className="flex bg-slate-900/50 p-1 rounded-2xl w-full">
                            <button 
                                onClick={() => setActiveCardTab('vista')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeCardTab === 'vista' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                À Vista
                            </button>
                            <button 
                                onClick={() => setActiveCardTab('recorrente')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeCardTab === 'recorrente' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Parcelados
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3">Valor</th>
                                    {activeCardTab === 'recorrente' && <th className="px-4 py-3">Parcela</th>}
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {data?.cardExpenses
                                    .filter(e => activeCardTab === 'vista' ? !e.isInstallment : e.isInstallment)
                                    .map(exp => (
                                    <React.Fragment key={exp.id}>
                                        <tr className="group hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    {activeCardTab === 'vista' && (
                                                        <button 
                                                            onClick={() => setExpandedExpense(prev => (prev === exp.id ? null : exp.id || null))}
                                                            className="p-1 hover:bg-slate-700 rounded text-slate-500"
                                                        >
                                                            {expandedExpense === exp.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{exp.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-black text-rose-400">R$ {exp.value.toLocaleString('pt-BR')}</td>
                                            {activeCardTab === 'recorrente' && (
                                                <td className="px-4 py-4 text-[10px] font-black text-indigo-400">
                                                    <span className="bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">
                                                        {exp.currentInstallment}/{exp.totalInstallments}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => toggleCardPaid(exp)} className="inline-flex">
                                                    {exp.paid ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400 transition-colors" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {!exp.isInstallment && (
                                                        <button 
                                                            onClick={() => {
                                                                setEditingCard(exp);
                                                                setCardFormData({ description: exp.description, value: exp.value, category: exp.category || 'Outros', paid: exp.paid });
                                                                setIsCardModalOpen(true);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteCard(exp.id!, exp.isInstallment)} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedExpense === exp.id && (
                                            <tr className="bg-slate-900/40">
                                                <td colSpan={activeCardTab === 'recorrente' ? 5 : 4} className="px-8 py-3">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">Categoria:</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-indigo-400">
                                                            {exp.category || 'Outros'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {data?.cardExpenses.filter(e => activeCardTab === 'vista' ? !e.isInstallment : e.isInstallment).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum gasto neste cartão</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Modals */}
            {/* Modal Conta Fixa */}
            <Modal isOpen={isFixedModalOpen} onClose={() => setIsFixedModalOpen(false)} title={editingFixed ? "Editar Conta Fixa" : "Nova Conta Fixa"}>
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Conta</label>
                        <input 
                            type="text" 
                            placeholder="Aluguel, Luz, etc..." 
                            value={fixedFormData.name}
                            onChange={e => setFixedFormData({...fixedFormData, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor (R$)</label>
                            <input 
                                type="number" 
                                value={fixedFormData.value}
                                onChange={e => setFixedFormData({...fixedFormData, value: e.target.valueAsNumber})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dia Vencimento</label>
                            <input 
                                type="number" 
                                value={fixedFormData.dueDate}
                                onChange={e => setFixedFormData({...fixedFormData, dueDate: e.target.valueAsNumber})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                    </div>
                    <button onClick={handleSaveFixed} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all">
                        {editingFixed ? "Atualizar" : "Salvar de Lucca"}
                    </button>
                </div>
            </Modal>

            {/* Modal Cartão à Vista */}
            <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title="Gasto Cartão à Vista">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Mercado Atacadão..." 
                            value={cardFormData.description}
                            onChange={e => setCardFormData({...cardFormData, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor (R$)</label>
                            <input 
                                type="number" 
                                value={cardFormData.value}
                                onChange={e => setCardFormData({...cardFormData, value: e.target.valueAsNumber})}
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
                    <button onClick={handleSaveCard} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all">
                        Salvar Gasto
                    </button>
                </div>
            </Modal>

            {/* Modal Parcelamento */}
            <Modal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} title="Novo Parcelamento Cartão">
                <div className="space-y-4 p-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição (Compra)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Geladeira, iPhone..." 
                            value={recurringFormData.description}
                            onChange={e => setRecurringFormData({...recurringFormData, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Parcela (R$)</label>
                            <input 
                                type="number" 
                                value={recurringFormData.value}
                                onChange={e => setRecurringFormData({...recurringFormData, value: e.target.valueAsNumber})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Parcelas</label>
                            <input 
                                type="number" 
                                value={recurringFormData.totalInstallments}
                                onChange={e => setRecurringFormData({...recurringFormData, totalInstallments: e.target.valueAsNumber})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                    </div>
                    <button onClick={handleSaveRecurring} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all">
                        Gerar Parcelas
                    </button>
                </div>
            </Modal>
        </div>
    );
}
