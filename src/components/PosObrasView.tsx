'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Building2, Plus, Trash2, Search, ChevronDown, ChevronUp, 
    DollarSign, Package, Users, Calendar, AlertCircle, Save, 
    CheckCircle2, X, HardHat, TrendingUp, Filter
} from 'lucide-react';
import { getPosObras, savePosObra, deletePosObra } from '../../app/actions';

interface PosObraGasto {
    id?: string;
    descricao: string;
    valor: number;
    tipo: 'Salário' | 'Produto';
    data?: string;
}

interface PosObra {
    id?: string;
    nome: string;
    cliente?: string;
    data?: string; // Mês de Recebimento
    valor?: number; // Preço
    status: 'Em Andamento' | 'Concluído';
    gastos: PosObraGasto[];
}

export default function PosObrasView() {
    const [obras, setObras] = useState<PosObra[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedObraId, setExpandedObraId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Modal para nova obra
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newObra, setNewObra] = useState<Partial<PosObra>>({
        nome: '',
        cliente: '',
        status: 'Em Andamento',
        gastos: []
    });

    useEffect(() => {
        loadObras();
    }, []);

    async function loadObras() {
        setIsLoading(true);
        const data = await getPosObras();
        setObras(data as PosObra[]);
        setIsLoading(false);
    }

    const filteredObras = useMemo(() => {
        return obras.filter(o => 
            o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [obras, searchTerm]);

    async function handleSaveObra(obra: PosObra) {
        setIsSaving(true);
        const res = await savePosObra(obra);
        if (res.success) {
            await loadObras();
            if (!obra.id) setIsModalOpen(false);
        } else {
            alert("Erro ao salvar: " + res.error);
        }
        setIsSaving(false);
    }

    async function handleDeleteObra(id: string) {
        if (!confirm("Tem certeza que deseja excluir esta obra e todos os seus gastos?")) return;
        const res = await deletePosObra(id);
        if (res.success) {
            await loadObras();
        } else {
            alert("Erro ao excluir: " + res.error);
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    const addGastoToObra = (obraId: string, tipo: 'Salário' | 'Produto') => {
        const obra = obras.find(o => o.id === obraId);
        if (!obra) return;

        const updatedObra = {
            ...obra,
            gastos: [
                ...obra.gastos,
                { descricao: '', valor: 0, tipo, data: new Date().toISOString().split('T')[0] }
            ]
        };
        
        // Atualiza localmente primeiro para feedback rápido
        setObras(obras.map(o => o.id === obraId ? updatedObra : o));
    };

    const updateGasto = (obraId: string, gastoIdx: number, field: keyof PosObraGasto, value: any) => {
        setObras(obras.map(o => {
            if (o.id !== obraId) return o;
            const newGastos = [...o.gastos];
            newGastos[gastoIdx] = { ...newGastos[gastoIdx], [field]: value };
            return { ...o, gastos: newGastos };
        }));
    };

    const removeGasto = (obraId: string, gastoIdx: number) => {
        setObras(obras.map(o => {
            if (o.id !== obraId) return o;
            const newGastos = o.gastos.filter((_, i) => i !== gastoIdx);
            return { ...o, gastos: newGastos };
        }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                        <HardHat className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão Pós-Obras</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Controle de custos e andamento de projetos</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar prédio ou cliente..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-900/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all w-64"
                        />
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Projeto
                    </button>
                </div>
            </div>

            {/* List of Obras */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                        <TrendingUp className="w-12 h-12 text-slate-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando Projetos...</p>
                    </div>
                ) : filteredObras.length === 0 ? (
                    <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-3xl py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                            <Building2 className="w-8 h-8 text-slate-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-slate-400">Nenhum projeto encontrado</h3>
                            <p className="text-xs text-slate-500">Comece adicionando um novo prédio pós-obra.</p>
                        </div>
                    </div>
                ) : (
                    filteredObras.map(obra => {
                        const isExpanded = expandedObraId === obra.id;
                        const totalSalarios = obra.gastos.filter(g => g.tipo === 'Salário').reduce((acc, g) => acc + g.valor, 0);
                        const totalProdutos = obra.gastos.filter(g => g.tipo === 'Produto').reduce((acc, g) => acc + g.valor, 0);
                        const totalGeral = totalSalarios + totalProdutos;

                        return (
                            <div key={obra.id} className={`bg-slate-800/40 rounded-3xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-500/50 shadow-2xl ring-1 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600 shadow-xl'}`}>
                                {/* Main Card Header */}
                                <div 
                                    className="p-6 flex items-center justify-between cursor-pointer group"
                                    onClick={() => setExpandedObraId(isExpanded ? null : obra.id!)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${obra.status === 'Concluído' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                            <Building2 className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{obra.nome}</h3>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${obra.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                    {obra.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">Cliente: <span className="text-slate-300">{obra.cliente || '--'}</span> • Mês: <span className="text-slate-300">{obra.data || '--'}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                         <div className="hidden lg:flex flex-col items-end">
                                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Valor do Projeto</span>
                                             <span className="text-xl font-black text-white italic">{formatCurrency(obra.valor || 0)}</span>
                                         </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteObra(obra.id!);
                                                }}
                                                className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className={`p-2 rounded-xl border transition-all ${isExpanded ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:border-slate-600'}`}>
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="border-t border-slate-700/50 pt-8 mt-2 space-y-8">
                                            {/* Metrics Inline */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mão de Obra</span>
                                                    <span className="text-lg font-black text-white">{formatCurrency(totalSalarios)}</span>
                                                </div>
                                                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Insumos/Produtos</span>
                                                    <span className="text-lg font-black text-white">{formatCurrency(totalProdutos)}</span>
                                                </div>
                                                <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/20 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Preço do Projeto</span>
                                                    <span className="text-lg font-black text-indigo-400">{formatCurrency(obra.valor || 0)}</span>
                                                </div>
                                                <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/20 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Custo Acumulado</span>
                                                    <span className="text-lg font-black text-rose-400">{formatCurrency(totalGeral)}</span>
                                                </div>
                                                <div className={`bg-slate-900/80 p-4 rounded-2xl border flex flex-col justify-center ${ (obra.valor || 0) - totalGeral >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ (obra.valor || 0) - totalGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Saldo (Preço - Custo)</span>
                                                    <span className={`text-lg font-black ${ (obra.valor || 0) - totalGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency((obra.valor || 0) - totalGeral)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Salários / Mão de Obra */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-indigo-400" /> Mão de Obra
                                                        </h4>
                                                        <button 
                                                            onClick={() => addGastoToObra(obra.id!, 'Salário')}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-indigo-400 transition-all active:scale-95"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="bg-slate-900/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-950/50 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                                                                    <th className="px-4 py-3">Descrição</th>
                                                                    <th className="px-4 py-3 text-right">Valor</th>
                                                                    <th className="px-4 py-3 w-10"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-700/20">
                                                                {obra.gastos.filter(g => g.tipo === 'Salário').map((gasto, idx) => {
                                                                    const realIdx = obra.gastos.findIndex(item => item === gasto);
                                                                    return (
                                                                        <tr key={idx} className="group hover:bg-slate-700/10">
                                                                            <td className="px-4 py-2">
                                                                                <input 
                                                                                    value={gasto.descricao}
                                                                                    onChange={e => updateGasto(obra.id!, realIdx, 'descricao', e.target.value)}
                                                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-white placeholder:text-slate-700"
                                                                                    placeholder="ex: Pintor, Limpeza..."
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <input 
                                                                                    type="number"
                                                                                    value={gasto.valor || ''}
                                                                                    onChange={e => updateGasto(obra.id!, realIdx, 'valor', e.target.value === '' ? 0 : Number(e.target.value))}
                                                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-24 text-right text-indigo-200"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <button 
                                                                                    onClick={() => removeGasto(obra.id!, realIdx)}
                                                                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Insumos / Produtos */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-emerald-400" /> Insumos / Produtos
                                                        </h4>
                                                        <button 
                                                            onClick={() => addGastoToObra(obra.id!, 'Produto')}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-emerald-400 transition-all active:scale-95"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="bg-slate-900/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-950/50 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                                                                    <th className="px-4 py-3">Descrição</th>
                                                                    <th className="px-4 py-3 text-right">Valor</th>
                                                                    <th className="px-4 py-3 w-10"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-700/20">
                                                                {obra.gastos.filter(g => g.tipo === 'Produto').map((gasto, idx) => {
                                                                    const realIdx = obra.gastos.findIndex(item => item === gasto);
                                                                    return (
                                                                        <tr key={idx} className="group hover:bg-slate-700/10">
                                                                            <td className="px-4 py-2">
                                                                                <input 
                                                                                    value={gasto.descricao}
                                                                                    onChange={e => updateGasto(obra.id!, realIdx, 'descricao', e.target.value)}
                                                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-white placeholder:text-slate-700"
                                                                                    placeholder="ex: Detergente, Luvas..."
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <input 
                                                                                    type="number"
                                                                                    value={gasto.valor || ''}
                                                                                    onChange={e => updateGasto(obra.id!, realIdx, 'valor', e.target.value === '' ? 0 : Number(e.target.value))}
                                                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-24 text-right text-emerald-200"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <button 
                                                                                    onClick={() => removeGasto(obra.id!, realIdx)}
                                                                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons inside expansion */}
                                            <div className="flex items-center justify-between pt-4">
                                                <div className="flex items-center gap-2">
                                                     <button 
                                                        onClick={() => {
                                                            const newStatus = obra.status === 'Concluído' ? 'Em Andamento' : 'Concluído';
                                                            setObras(obras.map(o => o.id === obra.id ? { ...o, status: newStatus as any } : o));
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${obra.status === 'Concluído' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                                                    >
                                                        {obra.status === 'Concluído' ? 'Marcar como Em Andamento' : 'Marcar como Concluído'}
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => handleSaveObra(obra)}
                                                    disabled={isSaving}
                                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 active:scale-95"
                                                >
                                                    {isSaving ? <TrendingUp className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Salvar Alterações
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal for New Profect */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-800 border border-slate-700/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                    <Plus className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Novo Projeto Pós-Obra</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inicie um novo controle de custos</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Prédio / Obra</label>
                                    <input 
                                        type="text" 
                                        placeholder="ex: Edifício Solar das Palmeiras"
                                        value={newObra.nome}
                                        onChange={e => setNewObra({...newObra, nome: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cliente / Construtora</label>
                                    <input 
                                        type="text" 
                                        placeholder="ex: ABC Construtora"
                                        value={newObra.cliente}
                                        onChange={e => setNewObra({...newObra, cliente: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mês de Recebimento</label>
                                        <input 
                                            type="text" 
                                            placeholder="ex: Março 2026"
                                            value={newObra.data}
                                            onChange={e => setNewObra({...newObra, data: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço</label>
                                        <input 
                                            type="number" 
                                            placeholder="R$ 0,00"
                                            value={newObra.valor || ''}
                                            onChange={e => setNewObra({...newObra, valor: e.target.value === '' ? undefined : Number(e.target.value)})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleSaveObra(newObra as PosObra)}
                                disabled={!newObra.nome || isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isSaving ? <TrendingUp className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Criar e Iniciar Projeto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
