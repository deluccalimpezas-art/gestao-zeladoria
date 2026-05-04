import { useState, useEffect, useRef } from 'react';
import { Building2, Search, Plus, Trash2, ChevronDown, ChevronUp, Calendar, UploadCloud, FileText, CheckCircle2, Loader2, Users, TrendingUp, ArrowUpDown, Check, AlertTriangle } from 'lucide-react';
import type { MasterRHData, CondominioData, FuncionarioData } from '../modelsFinance';
import { ADMIN_CONFIGS } from '../lib/adminConfigs';

interface CondoCardProps {
    condo: CondominioData;
    employees: FuncionarioData[];
    onUpdate: (field: keyof CondominioData, val: any) => void;
    onRemove: () => void;
    index: number;
    isSortedByProfit: boolean;
}

function CondoCard({ condo, employees, onUpdate, onRemove, index, isSortedByProfit }: CondoCardProps) {
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
        }).format(value).replace(/\s/g, '');
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
            case 'registrada': return 'bg-emerald-500';
            case 'precisa_registrar': return 'bg-amber-500';
            case 'em_processo': return 'bg-blue-500';
            case 'nao_vai_registrar': return 'bg-rose-500';
            default: return 'bg-slate-600';
        }
    };

    const baseValue = condo.valorContrato || 0;
    const inssDeduction = baseValue * 0.11; // Standard INSS 11% for contract display
    const totalSalaries = employees.reduce((acc, emp) => acc + (emp.salario || 0), 0);
    const totalEncargos = employees.reduce((acc, emp) => {
        if (emp.statusClt === 'registrada') {
            const is22h = condo.cargaHoraria === '22h';
            return acc + (is22h ? 859 : 1431);
        }
        return acc;
    }, 0);
    const projProfit = baseValue - inssDeduction - totalSalaries - totalEncargos;
    const profitMargin = baseValue > 0 ? (projProfit / baseValue) * 100 : 0;
    
    const targetMargin = baseValue > 2900 ? 20 : 30;
    const targetDivider = baseValue > 2900 ? 0.69 : 0.59; // Adjusted for 11% INSS
    const isLowProfit = isSortedByProfit && profitMargin < targetMargin;

    return (
        <div className={`group relative transition-all duration-500 ${isExpanded ? 'mb-8' : 'mb-3'}`}>
            <div 
                className={`relative overflow-hidden rounded-2xl border transition-all duration-500 bg-slate-800/20 backdrop-blur-sm ${
                    isExpanded 
                        ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20' 
                        : 'border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/40 shadow-lg'
                } ${isLowProfit ? 'ring-1 ring-rose-500/40 border-rose-500/30' : ''}`}
            >
                {/* Profitability Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${
                    isLowProfit ? 'bg-rose-500' : isExpanded ? 'bg-indigo-500' : 'bg-slate-700'
                }`} />

                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-5 flex items-center justify-between cursor-pointer"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                            isLowProfit 
                                ? 'bg-rose-500/10 text-rose-500' 
                                : isExpanded ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {isLowProfit ? <AlertTriangle className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
                            <div className="md:col-span-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-600 tabular-nums uppercase tracking-widest">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <input
                                        value={condo.nome}
                                        readOnly={!isExpanded}
                                        onClick={(e) => isExpanded && e.stopPropagation()}
                                        onChange={(e) => onUpdate('nome', e.target.value)}
                                        className={`bg-transparent border-none outline-none rounded px-0 py-0 w-full text-white font-black text-base tracking-tight transition-all ${!isExpanded ? 'cursor-pointer' : 'cursor-text focus:ring-0 focus:text-indigo-400'}`}
                                        placeholder="Nome do Condomínio"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ADM</span>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[80px]">
                                            {condo.administradora || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-mono font-medium text-slate-500 tracking-tighter">
                                        {maskCNPJ(condo.cnpj)}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col justify-center md:col-span-3">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Localização</p>
                                <p className="text-[11px] font-medium text-slate-400 truncate line-clamp-1 italic">
                                    {condo.endereco || 'Endereço não informado'}
                                </p>
                            </div>

                            <div className="hidden md:flex flex-col justify-center md:col-span-2">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Colaboradores</p>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                    {employees.length} <span className="text-[10px] text-slate-600 font-black">UNID</span>
                                </div>
                            </div>
                            
                            <div className="md:col-span-3 flex flex-col justify-center items-end">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[2px] mb-1">Faturamento Mensal</p>
                                <div className="flex items-center gap-3">
                                    {profitMargin < 15 && (
                                        <div className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black uppercase tracking-tighter animate-pulse">
                                            Atenção
                                        </div>
                                    )}
                                    <span className={`text-xl font-black tabular-nums tracking-tighter ${isLowProfit ? 'text-rose-400' : 'text-blue-400'}`}>
                                        {formatCurrency(condo.valorContrato || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4.5 h-4.5" />
                        </button>
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-600'}`}>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="px-5 pb-8 pt-2 border-t border-slate-700/50 bg-slate-900/40 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
                            {/* Left Column: Details & Contract */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-6 h-px bg-indigo-500/50" />
                                        Informações do Contrato
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Vigência Inicial</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                                <input
                                                    value={condo.inicio || ''}
                                                    onChange={(e) => onUpdate('inicio', e.target.value)}
                                                    className="bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 w-full text-blue-400 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Próxima Renovação</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                                <input
                                                    value={condo.termino || ''}
                                                    onChange={(e) => onUpdate('termino', e.target.value)}
                                                    className="bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 w-full text-emerald-400 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Configuração de Carga Horária</label>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-700/50 w-fit">
                                                {[
                                                    { id: '22h', label: 'Padrão 22h' },
                                                    { id: '44h', label: 'Padrão 44h' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => onUpdate('cargaHoraria', opt.id)}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${condo.cargaHoraria === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdate('cargaHoraria', '')}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!['22h', '44h'].includes(condo.cargaHoraria || '') ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                                >
                                                    Manual
                                                </button>
                                            </div>
                                            <input
                                                value={condo.cargaHoraria || ''}
                                                onChange={(e) => onUpdate('cargaHoraria', e.target.value)}
                                                className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 w-full text-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all italic"
                                                placeholder="Ex: Seg a Sex [08:00 - 17:00]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Arquivos e Documentos</label>
                                        <div className="flex items-center gap-4">
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
                                                    className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl px-4 py-3 w-full text-slate-400 text-xs font-bold cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-inner group/upload"
                                                >
                                                    <div className="p-1.5 bg-slate-700 rounded-lg group-hover/upload:bg-indigo-500/20 group-hover/upload:text-indigo-400 transition-colors">
                                                        <UploadCloud className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{condo.contratoNome || 'Importar PDF do Contrato assinado...'}</span>
                                                </label>
                                            </div>
                                            {condo.contratoPdf && (
                                                <button
                                                    onClick={() => handleDownload(condo.contratoPdf, condo.contratoNome || 'contrato.pdf')}
                                                    className="flex items-center gap-2 bg-indigo-500 text-white rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Ver PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
                                            Observações Internas
                                        </label>
                                        <textarea
                                            value={condo.observacao || ''}
                                            onChange={(e) => onUpdate('observacao', e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-[13px] text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all min-h-[140px] resize-none leading-relaxed shadow-inner"
                                            placeholder="Descreve aqui particularidades deste cliente, regras do condomínio ou histórico de reajustes..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Allocation & Profitability */}
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-6 h-px bg-indigo-500/50" />
                                        Quadro de Funcionários ({employees.length})
                                    </h4>
                                    <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden divide-y divide-slate-800/50">
                                        {employees.length > 0 ? (
                                            employees.map((emp, i) => (
                                                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors group/row">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2 h-2 rounded-full shadow-sm group-hover/row:scale-125 transition-transform ${getStatusColor(emp.statusClt)}`}></div>
                                                        <div>
                                                            <p className="text-xs font-black text-white tracking-tight">{emp.nome}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{emp.cargo || 'Funcionária'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-slate-300 tabular-nums">{formatCurrency(emp.salario || 0)}</p>
                                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Base Mensal</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center space-y-2">
                                                <Users className="w-8 h-8 text-slate-700 mx-auto" />
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sem registros vinculados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Projeção de Rentabilidade Premium */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-6 h-px bg-emerald-500/50" />
                                        Análise de Performance Financeira
                                    </h4>
                                    
                                    <div className="bg-slate-900/60 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
                                        <div className="p-6 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Margem Operacional</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-4xl font-black tracking-tighter ${
                                                            profitMargin >= 30 
                                                                 ? 'text-emerald-400' 
                                                                : profitMargin > 15 
                                                                    ? 'text-yellow-400' 
                                                                    : 'text-rose-400'
                                                        }`}>
                                                            {profitMargin.toFixed(1)}%
                                                        </span>
                                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                            profitMargin >= 30 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                        }`}>
                                                            {profitMargin >= 30 ? 'SAUDÁVEL' : 'ABAIXO DA META'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <TrendingUp className={`w-12 h-12 opacity-10 ${profitMargin >= 30 ? 'text-emerald-400' : 'text-rose-400'}`} />
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-bold tracking-tight uppercase text-[10px]">Faturamento Bruto</span>
                                                    <span className="text-white font-black tabular-nums">{formatCurrency(baseValue)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold tracking-tight uppercase text-[10px]">Imposto Estimado (11%)</span>
                                                    <span className="text-rose-500/80 font-bold tabular-nums">-{formatCurrency(inssDeduction)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold tracking-tight uppercase text-[10px]">Custo Operacional (Folha)</span>
                                                    <span className="text-rose-500/80 font-bold tabular-nums">-{formatCurrency(totalSalaries + totalEncargos)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-6 ${projProfit >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'} border-t border-slate-800/50`}>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Resultado Líquido</p>
                                                    <p className={`text-2xl font-black tabular-nums ${projProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {formatCurrency(projProfit)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Meta de Retorno</p>
                                                    <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-300 font-black text-[10px]">
                                                        {targetMargin}% <span className="text-slate-600">({formatCurrency((totalSalaries + totalEncargos) / targetDivider)})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isLowProfit && (
                                                <div className="mt-4 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-4 animate-pulse">
                                                    <div className="p-2 bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-500/20">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Sugestão de Reajuste</p>
                                                        <p className="text-xs font-bold text-rose-300">
                                                            Incrementar {formatCurrency(((totalSalaries + totalEncargos) / targetDivider) - baseValue)} para atingir a meta.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
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
    const [hasChanges, setHasChanges] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showTrash, setShowTrash] = useState(false);
    const [lastSavedData, setLastSavedData] = useState<string>(JSON.stringify(data));
    const [sortBy, setSortBy] = useState<'alfabetica' | 'valor' | 'lucro' | 'margem' | 'administradora'>('alfabetica');
    const [sortAsc, setSortAsc] = useState(true);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const localDataRef = useRef(localData);
    const hasChangesRef = useRef(false);

    useEffect(() => {
        localDataRef.current = localData;
        hasChangesRef.current = hasChanges;
    }, [localData, hasChanges]);

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
        // Sincroniza props -> local apenas se os dados recebidos forem 
        // significativamente diferentes do que acabamos de salvar E não houver alterações pendentes.
        if (hasChanges) return;

        const incoming = JSON.stringify(data);
        if (incoming !== lastSavedData) {
            setLocalData(data);
            setLastSavedData(incoming);
        }
    }, [data, lastSavedData, hasChanges]);

    useEffect(() => {
        if (!hasChanges) return;

        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            const newData = { ...localData, ultimaAtualizacao: new Date().toISOString() };
            const result = await onSaveRef.current(newData);
            if (result && result.success) {
                setLastSavedData(JSON.stringify(newData));
                setHasChanges(false);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('idle');
            }
        }, 1500); 

        return () => {
            clearTimeout(timer);
            if (hasChangesRef.current) {
                // Força salvamento ao sair se houver alterações pendentes
                const finalData = { ...localDataRef.current, ultimaAtualizacao: new Date().toISOString() };
                onSaveRef.current(finalData);
            }
        };
    }, [localData, hasChanges]);

    const updateCondo = (id: string, field: keyof CondominioData, value: any) => {
        setLocalData(prev => {
            const newList = prev.condominios.map(c => {
                if (c.id === id) {
                    const updated = { ...c, [field]: value };
                    
                    if (field === 'inicio' && typeof value === 'string' && value.length >= 8) {
                        const partsBar = value.split('/');
                        if (partsBar.length === 3) {
                            const day = parseInt(partsBar[0]);
                            const month = parseInt(partsBar[1]);
                            const year = parseInt(partsBar[2]);
                            if (day > 0 && month > 0 && year > 0) {
                                updated.termino = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 1}`;
                            }
                        }
                    }
                    return updated;
                }
                return c;
            });
            setHasChanges(true);
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
        setLocalData(prev => ({ ...prev, condominios: [newCondo, ...prev.condominios] }));
        setHasChanges(true);
    };

    const removeCondo = (id: string) => {
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.map(c => c.id === id ? { ...c, deleted: true } : c)
        }));
        setHasChanges(true);
    };

    const restoreCondo = (id: string) => {
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.map(c => c.id === id ? { ...c, deleted: false } : c)
        }));
        setHasChanges(true);
    };

    const permanentRemoveCondo = (id: string) => {
        if (!confirm("Excluir permanentemente?")) return;
        setLocalData(prev => ({
            ...prev,
            condominios: prev.condominios.filter(c => c.id !== id)
        }));
        setHasChanges(true);
    };

    const calcCondoProfit = (condo: CondominioData) => {
        const base = condo.valorContrato || 0;
        const inss = base * 0.13;
        const emps = localData.funcionarios.filter(f => f.condominioId === condo.id && !f.deleted);
        const salaries = emps.reduce((acc, emp) => acc + (emp.salario || 0), 0);
        const encargos = emps.reduce((acc, emp) => {
            if (emp.statusClt === 'registrada') {
                return acc + (condo.cargaHoraria === '22h' ? 859 : 1431);
            }
            return acc;
        }, 0);
        return base - inss - salaries - encargos;
    };

    const calcCondoMargin = (condo: CondominioData) => {
        const base = condo.valorContrato || 0;
        if (base === 0) return 0;
        return (calcCondoProfit(condo) / base) * 100;
    };

    const sortFn = (a: CondominioData, b: CondominioData) => {
        let res = 0;
        switch (sortBy) {
            case 'valor': res = (a.valorContrato || 0) - (b.valorContrato || 0); break;
            case 'lucro': res = calcCondoProfit(a) - calcCondoProfit(b); break;
            case 'margem': res = calcCondoMargin(a) - calcCondoMargin(b); break;
            case 'administradora': res = (a.administradora || '').localeCompare(b.administradora || ''); break;
            case 'alfabetica':
            default:
                res = a.nome.localeCompare(b.nome); break;
        }
        return sortAsc ? res : -res;
    };

    const filteredCondos = localData.condominios
        .filter(c => !c.deleted && c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort(sortFn);

    const trashCondos = localData.condominios
        .filter(c => c.deleted && c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort(sortFn);

    const handleSortOption = (type: typeof sortBy) => {
        if (sortBy === type) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(type);
            setSortAsc(type === 'alfabetica' || type === 'administradora');
        }
        setIsSortOpen(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Sticky Header with Top-Level Controls */}
            <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-6 mb-8 shadow-2xl">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Condomínios</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cadastro Mestre de Clientes e Contratos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {availableMonths.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-2 hidden md:block">Importar dados</span>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            onImportFromMonth(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-xl px-4 py-2 text-xs font-black cursor-pointer hover:bg-slate-600 transition-all outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecione um mês...</option>
                                    {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-4 border-l border-slate-700/50 pl-6 ml-2">
                            <div className="flex items-center min-w-[120px] justify-end">
                                {hasChanges && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 animate-pulse mr-3">Alterações Pendentes</span>
                                )}
                                {saveStatus === 'saving' && (
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                )}
                                {saveStatus === 'saved' && (
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shadow-lg shadow-emerald-500/10">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Header: Search and Primary Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800/50">
                    <div className="flex bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner w-fit">
                        <button 
                            onClick={() => setShowTrash(false)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showTrash ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'}`}
                        >
                            Ativos ({filteredCondos.length})
                        </button>
                        <button 
                            onClick={() => setShowTrash(true)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showTrash ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'}`}
                        >
                            Lixeira ({trashCondos.length})
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar condomínio pelo nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                        
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsSortOpen(!isSortOpen)} 
                                className={`p-3 border rounded-2xl transition-all flex items-center justify-center shadow-lg active:scale-95 ${isSortOpen ? 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                title="Ordenar por..."
                            >
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                            
                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-3 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-2.5 border-b border-slate-800/50 mb-1">
                                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500">Critério de Ordenação</p>
                                        </div>
                                        {[
                                            { id: 'alfabetica', label: 'Ordem Alfabética' },
                                            { id: 'valor', label: 'Por Valor Mensal' },
                                            { id: 'lucro', label: 'Por Lucratividade (R$)' },
                                            { id: 'margem', label: 'Por Margem de Lucro (%)' },
                                            { id: 'administradora', label: 'Por Administradora' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleSortOption(opt.id as any)}
                                                className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-tight transition-all flex items-center justify-between ${sortBy === opt.id ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
                                            >
                                                {opt.label}
                                                {sortBy === opt.id && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] font-black tracking-tighter text-indigo-400/60">
                                                            {sortAsc ? 'ASC' : 'DESC'}
                                                        </span>
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button 
                            onClick={addCondo}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Novo Cliente
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {!showTrash ? (
                    <div className="space-y-4 pb-20">
                        {filteredCondos.map((condo, idx) => (
                            <CondoCard 
                                key={condo.id}
                                condo={condo}
                                index={idx}
                                isSortedByProfit={sortBy === 'lucro' || sortBy === 'margem'}
                                employees={localData.funcionarios.filter(f => f.condominioId === condo.id && !f.deleted)}
                                onUpdate={(field, val) => {
                                    updateCondo(condo.id!, field, val);
                                }}
                                onRemove={() => removeCondo(condo.id!)}
                            />
                        ))}
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
