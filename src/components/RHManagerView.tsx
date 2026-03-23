import { useState, useEffect, useRef } from 'react';
import { Building2, Search, Plus, Trash2, ChevronDown, ChevronUp, Calendar, UploadCloud, FileText, CheckCircle2, Loader2, Users } from 'lucide-react';
import type { MasterRHData, CondominioData, FuncionarioData } from '../modelsFinance';

interface CondoCardProps {
    condo: CondominioData;
    employees: FuncionarioData[];
    onUpdate: (field: keyof CondominioData, val: any) => void;
    onRemove: () => void;
    index: number;
}

function CondoCard({ condo, employees, onUpdate, onRemove, index }: CondoCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, updateFn: (field: any, val: any) => void) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                updateFn('contratoPdf', base64);
                updateFn('contratoNome', file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = (base64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = base64.startsWith('data:') ? base64 : `data:application/pdf;base64,${base64}`;
        link.download = filename || 'contrato.pdf';
        link.click();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const maskCNPJ = (value: string | null) => {
        if (!value) return '';
        const digits = value.replace(/\D/g, '');
        return digits
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    };

    const unmaskCNPJ = (value: string) => value.replace(/\D/g, '');

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'registrada': return 'bg-green-500';
            case 'precisa_registrar': return 'bg-yellow-500';
            case 'em_processo': return 'bg-blue-500';
            case 'nao_vai_registrar': return 'bg-red-500';
            default: return 'bg-slate-600';
        }
    };

    return (
        <div className={`bg-slate-900/40 border transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5 scale-[1.01]' : 'border-slate-700/50 hover:border-slate-600'}`}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 flex items-center justify-between cursor-pointer group"
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'} transition-colors`}>
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                        <div className="relative md:col-span-2">
                            <input
                                value={condo.nome}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('nome', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-white font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Nome do Condomínio"
                            />
                            <span className="absolute -left-14 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 tabular-nums">
                                {String(index + 1).padStart(2, '0')}.
                            </span>
                        </div>
                        <div className="flex items-center md:col-span-1">
                            <input
                                value={condo.administradora || ''}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('administradora', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-slate-300 font-medium text-xs ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Administradora"
                            />
                        </div>
                        <div className="flex items-center md:col-span-1">
                            <input
                                value={maskCNPJ(condo.cnpj)}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('cnpj', unmaskCNPJ(e.target.value))}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-slate-300 text-xs font-mono font-medium ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        
                        <div className="md:col-span-1 flex items-center justify-end px-2">
                            {isExpanded ? (
                                <div className="w-full max-w-[120px]">
                                    <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5 text-right">Valor Mensal</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-1.5 text-[10px] text-slate-500 font-bold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={condo.valorContrato || ''}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => onUpdate('valorContrato', parseFloat(e.target.value) || 0)}
                                            className="bg-slate-800/50 border border-slate-700/50 outline-none focus:ring-1 focus:ring-indigo-500 rounded pl-6 pr-1.5 py-1 w-full text-indigo-400 font-bold text-xs cursor-text transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm font-black text-indigo-400 tracking-tight">
                                    {formatCurrency(condo.valorContrato || 0)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-5 pt-2 border-t border-slate-700/50 bg-slate-900/20 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Datas do Contrato
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-600 uppercase font-bold ml-1">Início</label>
                                    <input
                                        value={condo.inicio || ''}
                                        onChange={(e) => onUpdate('inicio', e.target.value)}
                                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-blue-400 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        placeholder="DD/MM/YYYY"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-600 uppercase font-bold ml-1">Vencimento</label>
                                    <input
                                        value={condo.termino || ''}
                                        onChange={(e) => onUpdate('termino', e.target.value)}
                                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-emerald-400 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        placeholder="DD/MM/YYYY"
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] text-slate-600 uppercase font-bold ml-1">Carga Horária</label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            {[
                                                { id: '22h', label: '22h' },
                                                { id: '44h', label: '44h' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => onUpdate('cargaHoraria', opt.id)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${condo.cargaHoraria === opt.id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => onUpdate('cargaHoraria', '')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${!['22h', '44h'].includes(condo.cargaHoraria || '') ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                            >
                                                Manual
                                            </button>
                                        </div>
                                        <input
                                            value={condo.cargaHoraria || ''}
                                            onChange={(e) => onUpdate('cargaHoraria', e.target.value)}
                                            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                            placeholder="Ex: Seg a Sex [08:00 - 17:00]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] text-slate-600 uppercase font-bold ml-1">Contrato (PDF)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => handleFileUpload(e, onUpdate)}
                                                className="hidden"
                                                id={`condo-contract-${condo.id}`}
                                            />
                                            <label
                                                htmlFor={`condo-contract-${condo.id}`}
                                                className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 border-dashed rounded-lg px-3 py-2 w-full text-slate-400 text-xs cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
                                            >
                                                <UploadCloud className="w-4 h-4 text-indigo-400" />
                                                <span>{condo.contratoNome || 'Importar PDF do Contrato'}</span>
                                            </label>
                                        </div>
                                        {condo.contratoPdf && (
                                            <button
                                                onClick={() => handleDownload(condo.contratoPdf, condo.contratoNome || 'contrato.pdf')}
                                                className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs font-bold hover:bg-indigo-500/30 transition-all"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Baixar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3 h-3" /> Funcionárias Alocadas ({employees.length})
                            </h4>
                            <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden divide-y divide-slate-700/30">
                                {employees.length > 0 ? (
                                    employees.map((emp, i) => (
                                        <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(emp.statusClt)}`}></div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{emp.nome}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{emp.cargo || 'Funcionária'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{formatCurrency(emp.salario || 0)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-xs text-slate-600 italic">Nenhuma funcionária vinculada.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-slate-700/30">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <FileText className="w-3 h-3" /> Observações do Condomínio
                                </label>
                                <textarea
                                    value={condo.observacao || ''}
                                    onChange={(e) => onUpdate('observacao', e.target.value)}
                                    className="w-full bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all min-h-[100px] resize-none"
                                    placeholder="Adicione observações importantes sobre este condomínio aqui..."
                                />
                            </div>
                        </div>
                    </div>
                    
                </div>
            )}
        </div>
    );
}

interface RHManagerViewProps {
    data: MasterRHData;
    onSave: (updated: MasterRHData) => Promise<{ success: boolean; error?: string } | void>;
    onImportFromMonth: (monthName: string) => void;
    availableMonths: string[];
}

export function RHManagerView({ data, onSave, onImportFromMonth, availableMonths }: RHManagerViewProps) {
    const [localData, setLocalData] = useState<MasterRHData>(data);
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showTrash, setShowTrash] = useState(false);
    const [lastSavedData, setLastSavedData] = useState<string>(JSON.stringify(data));

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
        // Sincroniza props -> local apenas se os dados recebidos forem 
        // significativamente diferentes do que acabamos de salvar.
        // Isso evita que a revalidação do servidor (que pode vir atrasada) 
        // sobrescreva o que o usuário ainda está digitando localmente.
        const incoming = JSON.stringify(data);
        if (incoming !== lastSavedData) {
            setLocalData(data);
            setLastSavedData(incoming);
        }
    }, [data, lastSavedData]);

    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            const newData = { ...localData, ultimaAtualizacao: new Date().toISOString() };
            const result = await onSaveRef.current(newData);
            if (result && result.success) {
                setLastSavedData(JSON.stringify(newData));
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('idle');
            }
        }, 2500); 
        return () => clearTimeout(timer);
    }, [localData]);

    const updateCondo = (index: number, field: keyof CondominioData, value: any) => {
        setLocalData(prev => {
            const newList = [...prev.condominios];
            const updatedCondo = { ...newList[index], [field]: value };
            
            if (field === 'inicio' && typeof value === 'string' && value.length >= 8) {
                let day = 0, month = 0, year = 0;
                const partsBar = value.split('/');
                if (partsBar.length === 3) {
                    day = parseInt(partsBar[0]);
                    month = parseInt(partsBar[1]);
                    year = parseInt(partsBar[2]);
                    if (day > 0 && month > 0 && year > 0) {
                        updatedCondo.termino = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 1}`;
                    }
                }
            }
            
            newList[index] = updatedCondo;
            return { ...prev, condominios: newList };
        });
    };

    const addCondo = () => {
        const newCondo: CondominioData = {
            id: crypto.randomUUID(),
            nome: 'Novo Condomínio',
            cnpj: '',
            receitaBruta: 0,
            inssRetido: 0,
            receitaLiquida: 0
        };
        setLocalData({ ...localData, condominios: [newCondo, ...localData.condominios] });
    };

    const removeCondo = (id: string) => {
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.map(c => c.id === id ? { ...c, deleted: true } : c)
        }));
    };

    const restoreCondo = (id: string) => {
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.map(c => c.id === id ? { ...c, deleted: false } : c)
        }));
    };

    const permanentRemoveCondo = (id: string) => {
        if (!confirm("Excluir permanentemente?")) return;
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.filter(c => c.id !== id)
        }));
    };

    const filteredCondos = localData.condominios
        .filter(c => !c.deleted && c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const trashCondos = localData.condominios
        .filter(c => c.deleted && c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-indigo-400" />
                        Gestão de Condomínios
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gerencie os dados dos prédios atendidos e seus contratos.</p>
                </div>
                <div className="flex items-center gap-3">
                    {availableMonths.length > 0 && (
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    onImportFromMonth(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="bg-slate-700 border border-slate-600 text-slate-200 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer hover:bg-slate-600 transition-all outline-none"
                            defaultValue=""
                        >
                            <option value="" disabled>📥 Importar de Planilha...</option>
                            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    )}
                    <div className="flex items-center gap-3">
                        {saveStatus === 'saving' && <span className="text-indigo-400 text-xs animate-pulse font-bold uppercase tracking-widest">Sincronizando...</span>}
                        {saveStatus === 'saved' && <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Sincronizado</span>}
                    </div>
                </div>
            </div>

            {/* Stats banner */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1 bg-slate-800/40 border border-indigo-500/20 rounded-2xl p-5">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Total dos Contratos</p>
                    <p className="text-3xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            localData.condominios
                                .filter(c => !c.deleted)
                                .reduce((acc, c) => acc + (c.valorContrato || 0), 0)
                        )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{filteredCondos.length} condomínios ativos</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Condomínios Ativos</p>
                    <p className="text-3xl font-black text-indigo-400">{filteredCondos.length}</p>
                    <p className="text-[11px] text-slate-500 mt-1">condomínios</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Na Lixeira</p>
                    <p className="text-3xl font-black text-rose-400">{trashCondos.length}</p>
                    <p className="text-[11px] text-slate-500 mt-1">condomínios</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button 
                        onClick={() => setShowTrash(false)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!showTrash ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                        Ativos ({filteredCondos.length})
                    </button>
                    <button 
                        onClick={() => setShowTrash(true)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${showTrash ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                    >
                        Lixeira ({trashCondos.length})
                    </button>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar condomínio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                {!showTrash ? (
                    <div className="space-y-4">
                        {filteredCondos.map((condo, idx) => (
                            <CondoCard 
                                key={condo.id}
                                condo={condo}
                                index={idx}
                                employees={data.funcionarios.filter(f => f.condominioId === condo.id && !f.deleted)}
                                onUpdate={(field, val) => {
                                    const idx = localData.condominios.findIndex(c => c.id === condo.id);
                                    updateCondo(idx, field, val);
                                }}
                                onRemove={() => removeCondo(condo.id!)}
                            />
                        ))}
                        <button 
                            onClick={addCondo}
                            className="w-full py-4 bg-indigo-500/5 border border-dashed border-indigo-500/30 rounded-xl text-indigo-400 flex items-center justify-center gap-2 hover:bg-indigo-500/10 transition-all font-bold"
                        >
                            <Plus className="w-5 h-5" /> Adicionar Condomínio
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trashCondos.map(condo => (
                            <div key={condo.id} className="bg-slate-900 shadow-xl border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                                <span className="text-white font-bold">{condo.nome}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => restoreCondo(condo.id!)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">RESTAURAR</button>
                                    <button onClick={() => permanentRemoveCondo(condo.id!)} className="p-1.5 bg-red-600 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                        {trashCondos.length === 0 && <p className="text-center text-slate-500 py-10">Lixeira vazia.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
