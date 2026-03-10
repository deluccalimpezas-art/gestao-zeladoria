import { useState, useEffect } from 'react';
import { Building2, Users, Save, Plus, Trash2, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { MasterRHData, CondominioData, FuncionarioData } from '../modelsFinance';

interface CondoCardProps {
    condo: CondominioData;
    employees: FuncionarioData[];
    onUpdate: (field: keyof CondominioData, val: any) => void;
    onRemove: () => void;
}

function CondoCard({ condo, employees, onUpdate, onRemove }: CondoCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div>
                            <input
                                value={condo.nome}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('nome', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-white font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Nome do Condomínio"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                value={condo.cnpj}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => onUpdate('cnpj', e.target.value)}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-slate-300 text-xs font-mono font-medium ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="CNPJ"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-600 text-xs font-bold">R$</span>
                            <input
                                value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(condo.valorContrato || 0)}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                    if (!isNaN(val)) onUpdate('valorContrato', val);
                                }}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-0.5 w-full text-indigo-400 font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                                placeholder="Valor"
                            />
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
    condominiosList: string[];
}

function EmployeeCard({ employee, onUpdate, onRemove, condominiosList }: EmployeeCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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
                        </div>
                        <div className="flex items-center">
                            {isExpanded ? (
                                <select
                                    value={employee.condominio || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => onUpdate('condominio', e.target.value)}
                                    className="bg-slate-800 border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 w-full text-slate-300 text-xs font-medium cursor-pointer"
                                >
                                    <option value="" disabled>Selecione um Condomínio...</option>
                                    {condominiosList.filter(Boolean).map(cName => (
                                        <option key={cName} value={cName}>{cName}</option>
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
                            <input
                                value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(employee.salario || 0)}
                                readOnly={!isExpanded}
                                onClick={(e) => isExpanded && e.stopPropagation()}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                    if (!isNaN(val)) onUpdate('salario', val);
                                }}
                                className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-0.5 w-full text-blue-400 font-bold text-sm ${!isExpanded ? 'cursor-pointer' : 'cursor-text'}`}
                            />
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
                    </div>
                </div>
            )}
        </div>
    );
}

interface RHManagerViewProps {
    data: MasterRHData;
    onSave: (updated: MasterRHData) => void;
    onImportFromMonth: (monthName: string) => void;
    availableMonths: string[];
}

export function RHManagerView({ data, onSave, onImportFromMonth, availableMonths }: RHManagerViewProps) {
    const [localData, setLocalData] = useState<MasterRHData>(data);
    const [activeSubTab, setActiveSubTab] = useState<'condos' | 'funcs'>('condos');
    const [searchTerm, setSearchTerm] = useState('');

    // Sincronizar se o data de fora mudar (importação)
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const handleSave = () => {
        onSave({ ...localData, ultimaAtualizacao: new Date().toISOString() });
    };

    const updateCondo = (index: number, field: keyof CondominioData, value: any) => {
        const newList = [...localData.condominios];
        newList[index] = { ...newList[index], [field]: value };
        setLocalData({ ...localData, condominios: newList });
    };

    const updateFunc = (index: number, field: keyof FuncionarioData, value: any) => {
        const newList = [...localData.funcionarios];
        newList[index] = { ...newList[index], [field]: value };
        setLocalData({ ...localData, funcionarios: newList });
    };

    const addCondo = () => {
        const newCondo: CondominioData = {
            nome: 'Novo Condomínio',
            cnpj: '',
            receitaBruta: 0,
            inssRetido: 0,
            receitaLiquida: 0
        };
        setLocalData({ ...localData, condominios: [newCondo, ...localData.condominios] });
    };

    const addFunc = () => {
        const defaultCondo = localData.condominios.length > 0 ? localData.condominios[0].nome : '';
        const newFunc: FuncionarioData = {
            condominio: defaultCondo,
            nome: 'Nova Funcionária',
            salario: 0,
            totalReceber: 0
        };
        setLocalData({ ...localData, funcionarios: [newFunc, ...localData.funcionarios] });
    };

    const removeCondo = (index: number) => {
        const newList = localData.condominios.filter((_, i) => i !== index);
        setLocalData({ ...localData, condominios: newList });
    };

    const removeFunc = (index: number) => {
        const newList = localData.funcionarios.filter((_, i) => i !== index);
        setLocalData({ ...localData, funcionarios: newList });
    };

    const filteredCondos = localData.condominios.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    );

    const filteredFuncs = localData.funcionarios.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.condominio.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Save className="w-4 h-4" /> Salvar Alterações
                    </button>
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
                                {localData.condominios.map((condo, originalIdx) => {
                                    const isMatch = condo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        condo.cnpj.includes(searchTerm);
                                    if (!isMatch) return null;

                                    const condoEmployees = localData.funcionarios.filter(f => f.condominio === condo.nome);
                                    return (
                                        <CondoCard
                                            key={originalIdx}
                                            condo={condo}
                                            employees={condoEmployees}
                                            onUpdate={(field, val) => updateCondo(originalIdx, field, val)}
                                            onRemove={() => removeCondo(originalIdx)}
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
                ) : (
                    <div className="p-6 space-y-4">
                        {filteredFuncs.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-500">Nenhuma funcionária encontrada.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {localData.funcionarios.map((func, originalIdx) => {
                                    const isMatch = func.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        func.condominio.toLowerCase().includes(searchTerm.toLowerCase());
                                    if (!isMatch) return null;

                                    return (
                                        <EmployeeCard
                                            key={originalIdx}
                                            employee={func}
                                            condominiosList={localData.condominios.map(c => c.nome)}
                                            onUpdate={(field, val) => updateFunc(originalIdx, field, val)}
                                            onRemove={() => removeFunc(originalIdx)}
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
