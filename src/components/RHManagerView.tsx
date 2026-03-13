import { useState, useEffect, useRef } from 'react';
import { Building2, Users, Search, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp, MapPin, Phone, Mail, Calendar, CreditCard, Clock, FileText, UploadCloud, Download, AlertCircle, CheckCircle2, RotateCcw, Trash, FileDown, ArrowRight, Loader2 } from 'lucide-react';
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        <div className="relative">
                            <input
                                value={condo.nome}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('nome', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-white font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Nome do Condomínio"
                            />
                            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 tabular-nums">
                                {String(index + 1).padStart(2, '0')}.
                            </span>
                        </div>
                        <div className="flex items-center">
                            <input
                                value={condo.administradora || ''}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('administradora', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-slate-300 font-medium text-xs ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Administradora"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                value={maskCNPJ(condo.cnpj)}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('cnpj', unmaskCNPJ(e.target.value))}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-slate-300 text-xs font-mono font-medium ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>                        <div className="flex items-center justify-end min-w-[200px] h-full">
                            {isExpanded ? (
                                <div className="flex items-center gap-3 w-full justify-end">
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 text-right">Base</label>
                                        <div className="relative flex items-center shadow-lg shadow-indigo-500/5">
                                            <span className="absolute left-2.5 text-xs text-slate-500 font-bold">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={condo.valorContrato || ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => onUpdate('valorContrato', parseFloat(e.target.value) || 0)}
                                                className={`bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg pl-8 pr-3 py-2 w-full text-indigo-400 font-bold text-sm cursor-text ${condo.valorAtivo !== 'verao' ? 'ring-2 ring-emerald-500' : ''} transition-all`}
                                                placeholder="Base"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 text-right">Verão</label>
                                        <div className="relative flex items-center shadow-lg shadow-orange-500/5">
                                            <span className="absolute left-2.5 text-xs text-slate-500 font-bold">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={condo.valorVerao || ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => onUpdate('valorVerao', parseFloat(e.target.value) || 0)}
                                                className={`bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl pl-8 pr-3 py-2 w-full text-orange-400 font-bold text-sm cursor-text ${condo.valorAtivo === 'verao' ? 'ring-2 ring-emerald-500' : ''} transition-all`}
                                                placeholder="Verão"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-center mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdate('valorAtivo', condo.valorAtivo === 'verao' ? 'base' : 'verao');
                                            }}
                                            className={`px-2 py-1.5 rounded-lg text-[9px] font-black transition-all shadow-md active:scale-95 border ${condo.valorAtivo === 'verao' ? 'bg-orange-500 text-white border-orange-400' : 'bg-indigo-600 text-white border-indigo-400'}`}
                                        >
                                            {condo.valorAtivo === 'verao' ? 'VERÃO' : 'BASE'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-1.5 flex flex-col items-end text-right min-w-[120px] shadow-inner">
                                    <span className={`font-bold text-sm leading-none ${condo.valorAtivo === 'verao' ? 'text-orange-400' : 'text-indigo-400'}`}>
                                        {formatCurrency(condo.valorAtivo === 'verao' ? (condo.valorVerao || 0) : (condo.valorContrato || 0))}
                                    </span>
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mt-0.5 opacity-70">
                                        {condo.valorAtivo === 'verao' ? 'Verão' : 'Base'}
                                    </span>
                                </div>
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
                                    <input
                                        value={condo.cargaHoraria || ''}
                                        onChange={(e) => onUpdate('cargaHoraria', e.target.value)}
                                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        placeholder="Ex: Seg a Sex [08:00 - 17:00]"
                                    />
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface EmployeeCardProps {
    employee: FuncionarioData;
    onUpdate: (field: keyof FuncionarioData, val: any) => void;
    onRemove: () => void;
    condominios: CondominioData[];
    index: number;
}

function EmployeeCard({ employee, onUpdate, onRemove, condominios, index }: EmployeeCardProps) {
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
        <div className={`bg-slate-900/40 border transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-500/5 scale-[1.01]' : 'border-slate-700/50 hover:border-slate-600'}`}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 flex items-center justify-between cursor-pointer group"
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3">
                        <select
                            value={employee.statusClt || 'registrada'}
                            disabled={!isExpanded}
                            onClick={(e) => isExpanded && e.stopPropagation()}
                            onChange={(e) => onUpdate('statusClt', e.target.value)}
                            className={`w-3.5 h-3.5 rounded-full appearance-none border-none p-0 outline-none text-transparent ${getStatusColor(employee.statusClt)} ring-2 ring-slate-800 ring-offset-1 ring-offset-slate-900 transition-all ${!isExpanded ? 'cursor-pointer opacity-80' : 'cursor-pointer'}`}
                            title="Status de Registro"
                        >
                            <option value="registrada" className="bg-slate-800 text-green-500 font-bold">● Registrada</option>
                            <option value="precisa_registrar" className="bg-slate-800 text-yellow-500 font-bold">● Precisa Registrar</option>
                            <option value="em_processo" className="bg-slate-800 text-blue-500 font-bold">● Em Processo</option>
                            <option value="nao_vai_registrar" className="bg-slate-800 text-red-500 font-bold">● Não vai registrar</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div>
                            <input
                                value={employee.nome}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('nome', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-0.5 w-full text-white font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Nome da Funcionária"
                            />
                            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 tabular-nums">
                                {String(index + 1).padStart(2, '0')}.
                            </span>
                        </div>
                        <div className="flex items-center">
                            {isExpanded ? (
                                <select
                                    value={employee.condominioId || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                        const selected = condominios.find(c => c.id === e.target.value);
                                        onUpdate('condominioId', e.target.value);
                                        if (selected) onUpdate('condominio', selected.nome);
                                    }}
                                    className="bg-slate-800 border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 w-full text-slate-300 text-xs font-medium cursor-pointer"
                                >
                                    <option value="" disabled>Selecione um Condomínio...</option>
                                    {condominios.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    value={employee.condominio || ''}
                                    readOnly={true}
                                    className="bg-transparent border-none outline-none rounded px-2 py-0.5 w-full text-slate-400 text-xs font-medium cursor-pointer"
                                    placeholder="Sem Condomínio"
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-600 text-xs font-bold">R$</span>
                            {isExpanded ? (
                                <input
                                    type="number"
                                    step="0.01"
                                    value={employee.salario || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => onUpdate('salario', parseFloat(e.target.value) || 0)}
                                    className="bg-slate-800 border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-0.5 w-full text-blue-400 font-bold text-sm cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="Salário base"
                                />
                            ) : (
                                <input
                                    value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(employee.salario || 0)}
                                    readOnly={true}
                                    className="bg-transparent border-none outline-none rounded px-2 py-0.5 w-full text-blue-400 font-bold text-sm cursor-pointer"
                                />
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
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-5 pt-2 border-t border-slate-700/50 bg-slate-900/20 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-blue-400" /> Admissão
                            </label>
                            <input
                                value={employee.dataAdmissao || ''}
                                onChange={(e) => onUpdate('dataAdmissao', e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-blue-300 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                placeholder="DD/MM/YYYY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-red-400" /> Venc. Experiência
                            </label>
                            <input
                                value={employee.fimContratoExperiencia || ''}
                                onChange={(e) => onUpdate('fimContratoExperiencia', e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-red-300 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                placeholder="DD/MM/YYYY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-amber-400" /> Venc. Férias
                            </label>
                            <input
                                value={employee.vencimentoFerias || ''}
                                onChange={(e) => onUpdate('vencimentoFerias', e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full text-amber-300 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                placeholder="DD/MM/YYYY"
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-indigo-400" /> Contrato (PDF)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileUpload(e, onUpdate)}
                                        className="hidden"
                                        id={`emp-contract-${employee.id}`}
                                    />
                                    <label
                                        htmlFor={`emp-contract-${employee.id}`}
                                        className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 border-dashed rounded-lg px-4 py-3 w-full text-slate-400 text-xs cursor-pointer hover:border-blue-500/50 hover:bg-slate-800 transition-all"
                                    >
                                        <UploadCloud className="w-5 h-5 text-blue-400" />
                                        <span>{employee.contratoNome || 'Importar PDF do Contrato de Trabalho'}</span>
                                    </label>
                                </div>
                                {employee.contratoPdf && (
                                    <button
                                        onClick={() => handleDownload(employee.contratoPdf, employee.contratoNome || 'contrato.pdf')}
                                        className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-3 text-xs font-bold hover:bg-blue-500/30 transition-all"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Baixar
                                    </button>
                                )}
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
    const [activeSubTab, setActiveSubTab] = useState<'condos' | 'funcs' | 'trash' | 'fired'>('condos');
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    // Ignora att automática se o usuário está manipulando dados agora para evitar perda de foco
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            // Sanitização inicial: tenta vincular por ID se só tiver o nome
            const sanitizedFuncs = data.funcionarios.map(f => {
                if (!f.condominioId && f.condominio) {
                    const condo = data.condominios.find(c => c.nome === f.condominio);
                    if (condo) return { ...f, condominioId: condo.id };
                }
                return f;
            });

            setLocalData({
                condominios: [...data.condominios],
                funcionarios: [...sanitizedFuncs],
                ultimaAtualizacao: data.ultimaAtualizacao
            });
            isFirstRender.current = false;
        }
    }, [data]);

    useEffect(() => {
        if (isFirstRender.current) return;
        
        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            const result = await onSaveRef.current({ ...localData, ultimaAtualizacao: new Date().toISOString() });
            
            // O MainContent agora retorna o resultado do saveMasterRH
            if (result && !result.success) {
                setSaveStatus('idle');
                // Não limpamos o status se houver erro crítico (o MainContent já deu alert)
            } else {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [localData]);

    const updateCondo = (index: number, field: keyof CondominioData, value: any) => {
        const newList = [...localData.condominios];
        const updatedCondo = { ...newList[index], [field]: value };
        
        // Auto-calculate End Date (termino) based on Start Date (inicio) + 1 year
        if (field === 'inicio' && typeof value === 'string' && value.length >= 8) {
            // Regex to match common date formats DD/MM/YYYY or YYYY-MM-DD
            let day = 0, month = 0, year = 0;
            const partsBar = value.split('/');
            const partsDash = value.split('-');
            
            if (partsBar.length === 3) {
                day = parseInt(partsBar[0]);
                month = parseInt(partsBar[1]);
                year = parseInt(partsBar[2]);
            } else if (partsDash.length === 3) {
                year = parseInt(partsDash[0]);
                month = parseInt(partsDash[1]);
                day = parseInt(partsDash[2]);
            }
            
            if (day > 0 && month > 0 && year > 0) {
                const nextYear = year + 1;
                // Formata DD/MM/YYYY
                const formattedDay = String(day).padStart(2, '0');
                const formattedMonth = String(month).padStart(2, '0');
                updatedCondo.termino = `${formattedDay}/${formattedMonth}/${nextYear}`;
            }
        }
        
        newList[index] = updatedCondo;

        // Propagate name change to linked employees for UI consistency
        if (field === 'nome') {
            const updatedFuncs = localData.funcionarios.map(f => {
                if (f.condominioId === updatedCondo.id) {
                    return { ...f, condominio: value };
                }
                return f;
            });
            setLocalData({ ...localData, condominios: newList, funcionarios: updatedFuncs });
        } else {
            setLocalData({ ...localData, condominios: newList });
        }
    };

    const updateFunc = (index: number, field: keyof FuncionarioData, value: any) => {
        const newList = [...localData.funcionarios];
        const updatedFunc = { ...newList[index], [field]: value };

        // Auto-calculate Vacation Due Date (vencimentoFerias) based on Admission Date (dataAdmissao) + 1 year
        if (field === 'dataAdmissao' && typeof value === 'string' && value.length >= 8) {
            let day = 0, month = 0, year = 0;
            const partsBar = value.split('/');
            const partsDash = value.split('-');
            
            if (partsBar.length === 3) {
                day = parseInt(partsBar[0]);
                month = parseInt(partsBar[1]);
                year = parseInt(partsBar[2]);
            } else if (partsDash.length === 3) {
                year = parseInt(partsDash[0]);
                month = parseInt(partsDash[1]);
                day = parseInt(partsDash[2]);
            }
            
            if (day > 0 && month > 0 && year > 0) {
                const nextYear = year + 1;
                const formattedDay = String(day).padStart(2, '0');
                const formattedMonth = String(month).padStart(2, '0');
                updatedFunc.vencimentoFerias = `${formattedDay}/${formattedMonth}/${nextYear}`;
            }
        }

        newList[index] = updatedFunc;
        setLocalData({ ...localData, funcionarios: newList });
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

    const addFunc = () => {
        const firstCondo = localData.condominios.length > 0 ? localData.condominios[0] : null;
        const newFunc: FuncionarioData = {
            id: crypto.randomUUID(),
            condominio: firstCondo ? firstCondo.nome : '',
            condominioId: firstCondo ? firstCondo.id : '',
            nome: 'Nova Funcionária',
            salario: 0,
            totalReceber: 0
        };
        setLocalData({ ...localData, funcionarios: [newFunc, ...localData.funcionarios] });
    };

    const removeCondo = (index: number) => {
        const condoId = localData.condominios[index].id;
        const newList = localData.condominios.map(c => 
            c.id === condoId ? { ...c, deleted: true } : c
        );
        setLocalData({ ...localData, condominios: newList });
    };

    const restoreCondo = (condoId: string) => {
        const newList = localData.condominios.map(c => 
            c.id === condoId ? { ...c, deleted: false } : c
        );
        setLocalData({ ...localData, condominios: newList });
    };

    const permanentRemoveCondo = async (condoId: string) => {
        if (!confirm("Tem certeza que deseja excluir esse condomínio permanentemente? Esta ação não pode ser desfeita.")) return;
        
        // Import dynamicamente ou assume-se que está disponível via onSave ou props se necessário
        // Mas o RHManagerView gerencia via localData e depois o MainContent salva tudo.
        // No entanto, para persistência imediata ou se for parte do save completo:
        const newList = localData.condominios.filter(c => c.id !== condoId);
        setLocalData({ ...localData, condominios: newList });
    };

    const removeFunc = (index: number) => {
        const funcId = localData.funcionarios[index].id;
        const newList = localData.funcionarios.map(f => 
            f.id === funcId ? { ...f, deleted: true } : f
        );
        setLocalData({ ...localData, funcionarios: newList });
    };

    const restoreFunc = (funcId: string) => {
        const newList = localData.funcionarios.map(f => 
            f.id === funcId ? { ...f, deleted: false } : f
        );
        setLocalData({ ...localData, funcionarios: newList });
    };

    const permanentRemoveFunc = async (funcId: string) => {
        if (!confirm("Tem certeza que deseja excluir essa funcionária permanentemente? Esta ação não pode ser desfeita.")) return;
        const newList = localData.funcionarios.filter(f => f.id !== funcId);
        setLocalData({ ...localData, funcionarios: newList });
    };

    const filteredCondos = [...localData.condominios]
        .filter(c =>
            !c.deleted && (
                c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.cnpj && c.cnpj.includes(searchTerm))
            )
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const trashCondos = [...localData.condominios]
        .filter(c =>
            c.deleted && (
                c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.cnpj && c.cnpj.includes(searchTerm))
            )
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const firedFuncs = [...localData.funcionarios]
        .filter(f =>
            f.deleted && (
                f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.condominio && f.condominio.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const filteredFuncs = [...localData.funcionarios]
        .filter(f =>
            !f.deleted && (
                f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.condominio && f.condominio.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-400" />
                        Base de Dados RH
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerencie os dados mestres de condomínios e funcionários que servem de base para o sistema.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {availableMonths.length > 0 && (
                        <div className="flex items-center gap-2">
                            <select
                                id="importMonthSelect"
                                defaultValue=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        onImportFromMonth(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                className="bg-slate-700 border border-slate-600 text-slate-200 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            >
                                <option value="" disabled>
                                    📥 Importar de Planilha...
                                </option>
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center">
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-2 text-indigo-400 text-sm font-medium px-4 py-2 bg-indigo-500/10 rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium px-4 py-2 bg-emerald-500/10 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" /> Salvo
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full md:w-auto">
                    <button
                        onClick={() => setActiveSubTab('condos')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'condos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Building2 className="w-4 h-4" /> Condomínios ({localData.condominios.length})
                    </button>
                    <button
                        onClick={() => setActiveSubTab('funcs')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'funcs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Users className="w-4 h-4" /> Funcionários ({localData.funcionarios.length})
                    </button>
                    <button
                        onClick={() => setActiveSubTab('fired')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'fired' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-orange-400/70'}`}
                    >
                        <Users className="w-4 h-4" /> Demitidos ({localData.funcionarios.filter(f => f.deleted).length})
                    </button>
                    <button
                        onClick={() => setActiveSubTab('trash')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'trash' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-red-400/70'}`}
                    >
                        <Trash2 className="w-4 h-4" /> Rescisões ({localData.condominios.filter(c => c.deleted).length})
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                {activeSubTab === 'condos' ? (
                    <div className="p-6 space-y-4">
                        {filteredCondos.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-500">Nenhum condomínio encontrado.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredCondos.map((condo, idx) => {
                                    const condoEmployees = localData.funcionarios.filter(f => f.condominioId === condo.id || (!f.condominioId && f.condominio === condo.nome));
                                    return (
                                        <CondoCard
                                            key={condo.id}
                                            condo={condo}
                                            index={idx}
                                            employees={condoEmployees}
                                            onUpdate={(field, val) => {
                                                const idx = localData.condominios.findIndex(c => c.id === condo.id);
                                                if (idx !== -1) updateCondo(idx, field, val);
                                            }}
                                            onRemove={() => {
                                                const idx = localData.condominios.findIndex(c => c.id === condo.id);
                                                if (idx !== -1) removeCondo(idx);
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        <button
                            onClick={addCondo}
                            className="w-full py-4 flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-xl text-sm font-semibold transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Adicionar Novo Condomínio
                        </button>
                    </div>
                ) : activeSubTab === 'trash' ? (
                    <div className="p-6 space-y-4">
                        <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 mb-6">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Os condomínios em rescisão aparecem aqui. Você pode restaurá-los ou excluí-los permanentemente.
                            </p>
                        </div>
                        {trashCondos.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-500">Nenhuma rescisão pendente.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {trashCondos.map((condo) => {
                                    return (
                                        <div key={condo.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-red-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-800 rounded-lg text-slate-500">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">{condo.nome}</h3>
                                                    <p className="text-xs text-slate-500">{condo.cnpj}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => restoreCondo(condo.id!)}
                                                    className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-500/30 transition-all"
                                                >
                                                    RESTAURAR
                                                </button>
                                                <button
                                                    onClick={() => permanentRemoveCondo(condo.id!)}
                                                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Excluir Permanentemente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeSubTab === 'fired' ? (
                    <div className="p-6 space-y-4">
                        <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 mb-6">
                            <p className="text-xs text-orange-400 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Lista de funcionários demitidos. Você pode restaurá-los ou excluí-los permanentemente.
                            </p>
                        </div>
                        {firedFuncs.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-500">Nenhum funcionário demitido.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {firedFuncs.map((f) => {
                                    return (
                                        <div key={f.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-800 rounded-lg text-slate-500">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">{f.nome}</h3>
                                                    <p className="text-xs text-slate-500">{f.cargo} - {f.condominio}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => restoreFunc(f.id!)}
                                                    className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-500/30 transition-all"
                                                >
                                                    RESTAURAR
                                                </button>
                                                <button
                                                    onClick={() => permanentRemoveFunc(f.id!)}
                                                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Excluir Permanentemente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {filteredFuncs.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-500">Nenhuma funcionária encontrada.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredFuncs.map((emp, idx) => {
                                    return (
                                        <EmployeeCard
                                            key={emp.id}
                                            employee={emp}
                                            index={idx}
                                            condominios={localData.condominios}
                                            onUpdate={(field, val) => {
                                                const idx = localData.funcionarios.findIndex(f => f.id === emp.id);
                                                if (idx !== -1) updateFunc(idx, field, val);
                                            }}
                                            onRemove={() => {
                                                const idx = localData.funcionarios.findIndex(f => f.id === emp.id);
                                                if (idx !== -1) removeFunc(idx);
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        <button
                            onClick={addFunc}
                            className="w-full py-4 flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-xl text-sm font-semibold transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Adicionar Nova Funcionária
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
