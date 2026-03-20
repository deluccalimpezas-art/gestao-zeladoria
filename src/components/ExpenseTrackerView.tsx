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
    MoreHorizontal
} from 'lucide-react';
import { GastoData } from '@/modelsFinance';
import { upsertGasto, deleteGasto, getGastos } from '../../app/actions';
import { Modal } from './Modal';

export function ExpenseTrackerView() {
    const [gastos, setGastos] = useState<GastoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGasto, setEditingGasto] = useState<GastoData | null>(null);
    
    const [formData, setFormData] = useState<GastoData>({
        descricao: '',
        valor: 0,
        categoria: 'Geral',
        data: new Date().toISOString().split('T')[0],
        formaPagto: 'Pix',
        observacao: ''
    });

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    useEffect(() => {
        fetchGastos();
    }, []);

    const fetchGastos = async () => {
        setLoading(true);
        const data = await getGastos();
        setGastos(data);
        setLoading(false);
    };

    const filteredGastos = useMemo(() => {
        return gastos.filter(g => {
            const date = new Date(g.data);
            const matchesMonth = date.getMonth() === selectedMonth;
            const matchesYear = date.getFullYear() === selectedYear;
            const matchesSearch = g.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (g.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
            return matchesMonth && matchesYear && matchesSearch;
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [gastos, selectedMonth, selectedYear, searchTerm]);

    const stats = useMemo(() => {
        const total = filteredGastos.reduce((acc, g) => acc + g.valor, 0);
        const categories: Record<string, number> = {};
        filteredGastos.forEach(g => {
            if (g.categoria) {
                categories[g.categoria] = (categories[g.categoria] || 0) + g.valor;
            }
        });
        
        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
        
        return {
            total,
            count: filteredGastos.length,
            topCategory: topCategory[0],
            topCategoryValue: topCategory[1]
        };
    }, [filteredGastos]);

    const handleOpenModal = (gasto?: GastoData) => {
        if (gasto) {
            setEditingGasto(gasto);
            setFormData({
                ...gasto,
                data: gasto.data.split('T')[0]
            });
        } else {
            setEditingGasto(null);
            setFormData({
                descricao: '',
                valor: 0,
                categoria: 'Geral',
                data: new Date().toISOString().split('T')[0],
                formaPagto: 'Pix',
                observacao: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.descricao || formData.valor <= 0) {
            alert("Preencha a descrição e o valor corretamente.");
            return;
        }

        const res = await upsertGasto(formData);
        if (res.success) {
            setIsModalOpen(false);
            fetchGastos();
        } else {
            alert("Erro ao salvar: " + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Excluir este gasto?")) {
            const res = await deleteGasto(id);
            if (res.success) {
                fetchGastos();
            } else {
                alert("Erro ao excluir: " + res.error);
            }
        }
    };

    const changeMonth = (delta: number) => {
        let newMonth = selectedMonth + delta;
        let newYear = selectedYear;
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                        <Wallet className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Fluxo de Gastos</h1>
                        <p className="text-sm text-slate-400 font-medium">Controle mensal de despesas variáveis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden shadow-inner">
                        <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 py-2 text-center min-w-[140px]">
                            <span className="text-sm font-bold text-white uppercase tracking-widest">{months[selectedMonth]}</span>
                            <span className="block text-[10px] text-slate-500 font-black">{selectedYear}</span>
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-800 text-slate-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Gasto
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-3xl border border-slate-700/50 shadow-xl group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest bg-slate-900/50 px-2 py-1 rounded">Mensal</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gasto</p>
                    <p className="text-3xl font-black text-white">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-3xl border border-slate-700/50 shadow-xl group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <Filter className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest bg-slate-900/50 px-2 py-1 rounded">Frequente</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Maior Categoria</p>
                    <p className="text-3xl font-black text-white truncate">{stats.topCategory}</p>
                    <p className="text-xs text-amber-400/60 font-bold mt-1">R$ {stats.topCategoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acumulados</p>
                </div>

                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-3xl border border-slate-700/50 shadow-xl group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Search className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest bg-slate-900/50 px-2 py-1 rounded">Volume</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Qtd. Lançamentos</p>
                    <p className="text-3xl font-black text-white">{stats.count} Gastos</p>
                    <p className="text-xs text-blue-400/60 font-bold mt-1">Média de R$ {(stats.count > 0 ? stats.total / stats.count : 0).toFixed(2)} / item</p>
                </div>
            </div>

            {/* Main Content Table Area */}
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar descrição ou categoria..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Forma Pagto.</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Fluxo...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGastos.length > 0 ? (
                                filteredGastos.map((g) => (
                                    <tr key={g.id} className="hover:bg-slate-700/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 group-hover:text-indigo-400 transition-colors">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-300">{new Date(g.data).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white uppercase tracking-tight">{g.descricao}</span>
                                                {g.observacao && <span className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">{g.observacao}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-indigo-400">
                                                {g.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-lg">
                                                - R$ {g.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-xs font-bold text-slate-400">{g.formaPagto}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenModal(g)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(g.id!)}
                                                    className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700 border-dashed animate-pulse">
                                                <TrendingDown className="w-10 h-10 text-slate-700" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white">Nenhum gasto registrado</p>
                                                <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Inicie seu fluxo de caixa clicando em Novo Gasto</p>
                                            </div>
                                            <button 
                                                onClick={() => handleOpenModal()}
                                                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/30 px-6 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-xs transition-all"
                                            >
                                                Começar Agora
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingGasto ? "Editar Lançamento" : "Novo Lançamento"}
            >
                <div className="space-y-5 p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Descrição</label>
                            <input 
                                type="text"
                                value={formData.descricao}
                                onChange={e => setFormData({...formData, descricao: e.target.value})}
                                placeholder="O que você pagou?"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Valor (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input 
                                    type="number"
                                    value={formData.valor}
                                    onChange={e => setFormData({...formData, valor: e.target.valueAsNumber})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-black"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Data</label>
                            <input 
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData({...formData, data: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Categoria</label>
                            <select 
                                value={formData.categoria}
                                onChange={e => setFormData({...formData, categoria: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            >
                                <option value="Geral">Geral</option>
                                <option value="Alimentação">Alimentação</option>
                                <option value="Transporte">Transporte</option>
                                <option value="Aluguel/Sede">Aluguel/Sede</option>
                                <option value="Salários/Extras">Salários/Extras</option>
                                <option value="Impostos">Impostos</option>
                                <option value="Materiais">Materiais</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Pagamento</label>
                            <select 
                                value={formData.formaPagto}
                                onChange={e => setFormData({...formData, formaPagto: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            >
                                <option value="Pix">Pix</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                <option value="Boleto">Boleto</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Transferência">Transferência</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Observações (Opcional)</label>
                            <textarea 
                                value={formData.observacao}
                                onChange={e => setFormData({...formData, observacao: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 h-24 resize-none"
                                placeholder="Deseja adicionar algum comentário?"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 text-sm font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] mt-4"
                    >
                        {editingGasto ? "Atualizar Lançamento" : "Salvar Lançamento"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
