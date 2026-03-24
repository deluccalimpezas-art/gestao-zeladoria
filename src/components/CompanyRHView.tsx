import { useState, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Plus, 
    Briefcase, 
    Calendar, 
    DollarSign, 
    UserCheck, 
    MoreHorizontal,
    TrendingUp,
    ShieldCheck,
    Building,
    ChevronDown,
    SearchX,
    Folder,
    FolderOpen,
    CheckCircle2,
    Clock,
    UserMinus,
    AlertCircle,
    User,
    Loader2,
    Trash2,
    RotateCcw,
    X,
    Phone,
    Mail,
    MapPin,
    Building2,
    FileText,
    Printer,
    FileCheck
} from 'lucide-react';
import type { MasterRHData, FuncionarioData, CondominioData, CandidatoData } from '../modelsFinance';

interface CompanyRHViewProps {
    data: MasterRHData;
    onSave: (updated: MasterRHData) => Promise<{ success: boolean; error?: string } | void>;
}

type RegistrationStatus = 'registrada' | 'precisa_registrar' | 'em_processo' | 'nao_vai_registrar' | 'afastada_inss' | 'ferias';
type RegistrationCategory = 'Todos' | 'Gestão' | 'Registradas' | 'Precisa Registrar' | 'Em Processo' | 'Não vai Registrar' | 'Afastadas INSS' | 'Férias' | 'Candidatos' | 'Impostos' | 'Lixeira';

const STATUS_MAP: Record<RegistrationStatus, Exclude<RegistrationCategory, 'Todos' | 'Lixeira' | 'Candidatos' | 'Gestão'>> = {
    'registrada': 'Registradas',
    'precisa_registrar': 'Precisa Registrar',
    'em_processo': 'Em Processo',
    'nao_vai_registrar': 'Não vai Registrar',
    'afastada_inss': 'Afastadas INSS',
    'ferias': 'Férias'
};

export function CompanyRHView({ data, onSave }: CompanyRHViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<RegistrationCategory>('Todos');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState<string | null>(null);
    
    // Estados de edição
    const [inlineEditingData, setInlineEditingData] = useState<Record<string, FuncionarioData>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Partial<FuncionarioData>>({
        nome: '',
        cargo: '',
        salario: 0,
        totalReceber: 0,
        statusClt: 'precisa_registrar',
        condominio: ''
    });

    // Candidatos state
    const [isAddCandidatoOpen, setIsAddCandidatoOpen] = useState(false);
    const [newCandidato, setNewCandidato] = useState({ nome: '', telefone: '', observacao: '' });

    // Impostos state
    const [isAddImpostoOpen, setIsAddImpostoOpen] = useState(false);
    const [newRHImposto, setNewRHImposto] = useState({ nome: '', valor: 0 });

    // Printing state
    const [printingContract, setPrintingContract] = useState<{ employee: FuncionarioData, type: 'trabalho' | 'demissao' } | null>(null);

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
            // Limpar dados temporários ao fechar
            const updatedData = { ...inlineEditingData };
            delete updatedData[id];
            setInlineEditingData(updatedData);
        } else {
            newExpanded.add(id);
            // Inicializar dados de edição com cópia do funcionário
            const emp = data.funcionarios.find(f => f.id === id);
            if (emp) {
                setInlineEditingData(prev => ({ ...prev, [id]: { ...emp } }));
            }
        }
        setExpandedRows(newExpanded);
    };

    const getCategory = (status: string | undefined): RegistrationCategory => {
        if (!status) return 'Precisa Registrar';
        const s = status.toLowerCase();
        if (s.includes('afastada') || s.includes('inss')) return 'Afastadas INSS';
        if (s.includes('feri')) return 'Férias';
        if (s.includes('registrada') || s === 'clt') return 'Registradas';
        if (s.includes('nao') || s.includes('não')) return 'Não vai Registrar';
        if (s.includes('processo')) return 'Em Processo';
        return 'Precisa Registrar';
    };

    const handleStatusChange = async (employeeId: string, newStatus: RegistrationStatus) => {
        setIsSaving(employeeId);
        try {
            const updatedFuncionarios = data.funcionarios.map(f => 
                f.id === employeeId ? { ...f, statusClt: newStatus } : f
            );
            await onSave({ ...data, funcionarios: updatedFuncionarios });
        } finally {
            setIsSaving(null);
        }
    };

    const handleDelete = async (employeeId: string) => {
        const updatedFuncionarios = data.funcionarios.map(f => 
            f.id === employeeId ? { ...f, deleted: true } : f
        );
        await onSave({ ...data, funcionarios: updatedFuncionarios });
        setConfirmDeleteId(null);
        setExpandedRows(prev => { const s = new Set(prev); s.delete(employeeId); return s; });
    };

    const handleRestore = async (employeeId: string) => {
        const updatedFuncionarios = data.funcionarios.map(f => 
            f.id === employeeId ? { ...f, deleted: false } : f
        );
        await onSave({ ...data, funcionarios: updatedFuncionarios });
    };

    const handlePermanentDelete = async (employeeId: string) => {
        if (!confirm("Excluir permanentemente? Esta ação não pode ser desfeita.")) return;
        const updatedFuncionarios = data.funcionarios.filter(f => f.id !== employeeId);
        await onSave({ ...data, funcionarios: updatedFuncionarios });
    };

    const handleAutoSave = async (employeeId: string, updatedField: Partial<FuncionarioData>) => {
        const current = inlineEditingData[employeeId];
        if (!current) return;
        const merged = { ...current, ...updatedField };
        setInlineEditingData(prev => ({ ...prev, [employeeId]: merged }));
        setIsSaving(employeeId);
        try {
            const updatedFuncionarios = data.funcionarios.map(f =>
                f.id === employeeId ? merged : f
            );
            await onSave({ ...data, funcionarios: updatedFuncionarios });
        } finally {
            setIsSaving(null);
        }
    };

    const handleAddNew = async () => {
        if (!newEmployee.nome) return alert("Nome é obrigatório");
        const fresh: FuncionarioData = {
            id: crypto.randomUUID(),
            nome: newEmployee.nome,
            cargo: newEmployee.cargo || '',
            salario: newEmployee.salario || 0,
            totalReceber: newEmployee.salario || 0,
            statusClt: (newEmployee.statusClt as any) || 'precisa_registrar',
            condominio: newEmployee.condominio || 'Sede',
            condominioId: newEmployee.condominioId,
            dataAdmissao: newEmployee.dataAdmissao || '',
            vencimentoFerias: newEmployee.vencimentoFerias || '',
            fimContratoExperiencia: newEmployee.fimContratoExperiencia || '',
            deleted: false
        };
        const res = await onSave({ ...data, funcionarios: [fresh, ...data.funcionarios] });
        if (!res || res.success) {
            setIsAddModalOpen(false);
            setNewEmployee({ nome: '', cargo: '', salario: 0, statusClt: 'precisa_registrar', condominio: '' });
        }
    };

    const handleAddCandidato = async () => {
        if (!newCandidato.nome) return alert('Nome é obrigatório');
        const fresh: CandidatoData = {
            id: crypto.randomUUID(),
            nome: newCandidato.nome,
            telefone: newCandidato.telefone,
            observacao: newCandidato.observacao,
            dataRegistro: new Date().toLocaleDateString('pt-BR')
        };
        await onSave({ ...data, candidatos: [fresh, ...(data.candidatos || [])] });
        setIsAddCandidatoOpen(false);
        setNewCandidato({ nome: '', telefone: '', observacao: '' });
    };

    const handleDeleteCandidato = async (id: string) => {
        await onSave({ ...data, candidatos: (data.candidatos || []).filter(c => c.id !== id) });
    };

    const handleAddRHImposto = async () => {
        if (!newRHImposto.nome) return alert("Nome é obrigatório");
        const fresh = { 
            id: crypto.randomUUID(), 
            nome: newRHImposto.nome, 
            valor: newRHImposto.valor, 
            vencimento: "" 
        };
        await onSave({ ...data, impostos: [...(data.impostos || []), fresh] });
        setIsAddImpostoOpen(false);
        setNewRHImposto({ nome: '', valor: 0 });
    };

    const employees = useMemo(() => {
        if (activeCategory === 'Candidatos') return [];
        return data.funcionarios.filter(f => {
            const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (f.cargo && f.cargo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 (f.condominio && f.condominio.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (activeCategory === 'Lixeira') return f.deleted && matchesSearch;
            if (f.deleted) return false;
            
            if (activeCategory === 'Gestão') {
                return matchesSearch && ['Gerente', 'Volante', 'RH'].includes(f.condominio);
            }

            const matchesCategory = activeCategory === 'Todos' || getCategory(f.statusClt) === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [data.funcionarios, searchTerm, activeCategory]);

    const categories: { label: RegistrationCategory; icon: any; color: string }[] = [
        { label: 'Todos', icon: Folder, color: 'text-slate-400' },
        { label: 'Gestão', icon: ShieldCheck, color: 'text-indigo-400' },
        { label: 'Registradas', icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Precisa Registrar', icon: Clock, color: 'text-amber-400' },
        { label: 'Em Processo', icon: Briefcase, color: 'text-blue-400' },
        { label: 'Não vai Registrar', icon: UserMinus, color: 'text-rose-400' },
        { label: 'Afastadas INSS', icon: AlertCircle, color: 'text-orange-400' },
        { label: 'Férias', icon: Calendar, color: 'text-indigo-400' },
        { label: 'Candidatos', icon: Users, color: 'text-violet-400' },
        { label: 'Impostos', icon: DollarSign, color: 'text-amber-500' },
        { label: 'Lixeira', icon: Trash2, color: 'text-red-400' },
    ];

    const statsByCategory = useMemo(() => {
        const counts: Record<string, number> = {
            'Todos': 0, 'Registradas': 0, 'Precisa Registrar': 0, 'Em Processo': 0, 'Não vai Registrar': 0, 'Afastadas INSS': 0, 'Férias': 0, 'Candidatos': 0, 'Lixeira': 0, 'Gestão': 0
        };
        data.funcionarios.forEach(f => {
            if (f.deleted) {
                counts['Lixeira']++;
            } else {
                counts['Todos']++;
                counts[getCategory(f.statusClt)]++;
                if (['Gerente', 'Volante', 'RH'].includes(f.condominio)) {
                    counts['Gestão']++;
                }
            }
        });
        counts['Candidatos'] = (data.candidatos || []).length;
        counts['Impostos'] = (data.impostos || []).length;
        return counts;
    }, [data.funcionarios, data.candidatos, data.impostos]);

    const stats = useMemo(() => {
        const totalSalaries = employees.reduce((acc, curr) => acc + (curr.salario || 0), 0);
        return { totalSalaries };
    }, [employees]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="relative overflow-hidden bg-slate-800/40 border border-slate-700 rounded-3xl p-6 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-48 h-48 text-indigo-400" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400/80">Gestão Global de RH</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">RH da Empresa</h1>
                        <p className="text-slate-400 mt-1 max-w-lg text-sm leading-relaxed">
                            Controle unificado de colaboradores. Registre, gerencie e organize toda a equipe em um só lugar.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl px-5 py-3 shadow-xl text-right min-w-[160px]">
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Folha {activeCategory}</p>
                            <div className="flex items-baseline justify-end gap-2">
                                <span className="text-xl font-black text-white">{formatCurrency(stats.totalSalaries)}</span>
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Folders */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/20 border border-slate-700/50 rounded-3xl overflow-hidden shadow-inner">
                {categories.map((cat) => (
                    <button
                        key={cat.label}
                        onClick={() => setActiveCategory(cat.label)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest group ${activeCategory === cat.label ? (cat.label === 'Lixeira' ? 'bg-red-600' : 'bg-indigo-600') + ' text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}
                    >
                        {activeCategory === cat.label ? <FolderOpen className="w-4 h-4" /> : <cat.icon className={`w-4 h-4 ${cat.color}`} />}
                        {cat.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeCategory === cat.label ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                            {statsByCategory[cat.label]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={`Buscar colaborador...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                    />
                </div>
                {activeCategory === 'Candidatos' ? (
                    <button 
                        onClick={() => setIsAddCandidatoOpen(true)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-violet-600/20 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Novo Candidato
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 shadow-sm" /> Novo Cadastro
                    </button>
                )}
            </div>

            {/* Candidatos Panel */}
            {activeCategory === 'Candidatos' && (
                <div className="space-y-3 pb-12">
                    {(data.candidatos || []).filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone.includes(searchTerm)).length > 0 ? (
                        (data.candidatos || [])
                            .filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone.includes(searchTerm))
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map((candidato) => (
                                <div key={candidato.id} className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-3xl">
                                    <div className="p-2.5 rounded-xl bg-violet-900/40 border border-violet-700/30 text-violet-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="grid grid-cols-[2fr_1.5fr] gap-4 flex-1 min-w-0">
                                        <h3 className="font-black text-white uppercase tracking-tight truncate">{candidato.nome}</h3>
                                        <div className="flex items-center gap-1.5 text-violet-400/70 text-[11px] font-bold">
                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                            <span>{candidato.telefone || 'Sem telefone'}</span>
                                        </div>
                                    </div>
                                    {candidato.observacao && (
                                        <span className="hidden md:block text-[10px] text-slate-500 italic truncate max-w-[200px]">{candidato.observacao}</span>
                                    )}
                                    <span className="text-[10px] text-slate-600 shrink-0">{candidato.dataRegistro}</span>
                                    <button
                                        onClick={() => handleDeleteCandidato(candidato.id)}
                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                    ) : (
                        <div className="py-20 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-3xl text-center">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Nenhum candidato</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Adicione candidatos para futuras contratações.</p>
                        </div>
                    )}

                    {/* Add Candidato Modal */}
                    {isAddCandidatoOpen && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddCandidatoOpen(false)}>
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Novo Candidato</h2>
                                    <button onClick={() => setIsAddCandidatoOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nome Completo *</label>
                                        <input type="text" value={newCandidato.nome} onChange={(e) => setNewCandidato(prev => ({ ...prev, nome: e.target.value }))}
                                            className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500/30 outline-none" placeholder="Nome do candidato" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Telefone / WhatsApp</label>
                                        <input type="tel" value={newCandidato.telefone} onChange={(e) => setNewCandidato(prev => ({ ...prev, telefone: e.target.value }))}
                                            className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500/30 outline-none" placeholder="(11) 99999-9999" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Observação</label>
                                        <textarea value={newCandidato.observacao} onChange={(e) => setNewCandidato(prev => ({ ...prev, observacao: e.target.value }))}
                                            className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500/30 outline-none resize-none" rows={2} placeholder="Ex: Boa referência, disponível imediatamente..." />
                                    </div>
                                    <button onClick={handleAddCandidato}
                                        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20">
                                        Adicionar Candidato
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Employee List */}
            <div className="space-y-3 pb-12" style={{ display: activeCategory === 'Candidatos' ? 'none' : undefined }}>
                {employees.length > 0 ? (
                    employees.map((employee: FuncionarioData) => {
                        const isExpanded = employee.id ? expandedRows.has(employee.id) : false;
                        const category = getCategory(employee.statusClt);
                        
                        return (
                            <div key={employee.id} className="group overflow-hidden">
                                <div 
                                    onClick={() => employee.id && toggleRow(employee.id)}
                                    className={`relative p-4 bg-slate-800/30 border ${isExpanded ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-700/50 hover:bg-slate-800/60'} rounded-3xl transition-all cursor-pointer select-none`}
                                >
                                    <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_140px_auto] items-center gap-6">
                                        <div className={`p-2.5 rounded-xl border ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-indigo-400'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <h3 className="font-black text-white uppercase tracking-tight truncate">{employee.nome}</h3>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest truncate">
                                            <Building className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                            <span className="truncate">{employee.condominio || 'Não Definido'}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-[12px] font-black uppercase tracking-tight">
                                            <DollarSign className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                            <span>{formatCurrency(employee.salario || 0)}</span>
                                        </div>

                                        <div className="flex justify-end">
                                            {employee.deleted ? (
                                                <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter shrink-0">Lixeira</span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shrink-0 ${category === 'Registradas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : category === 'Precisa Registrar' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                                    {category}
                                                </span>
                                            )}
                                        </div>

                                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-all ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} />
                                    </div>
                                </div>

                                {isExpanded && inlineEditingData[employee.id!] && (
                                    <div className="mx-6 px-8 py-6 bg-slate-800/40 border-x border-b border-indigo-500/20 rounded-b-[2rem] -mt-4 pt-10 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                            {/* Column 1: Core Info */}
                                            <div className="space-y-4 col-span-1 md:col-span-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                                        <input 
                                                            type="text" 
                                                            value={inlineEditingData[employee.id!].nome}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], nome: e.target.value }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { nome: e.target.value })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 hidden">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo / Função</label>
                                                        <input 
                                                            type="text" 
                                                            value={inlineEditingData[employee.id!].cargo || ''}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], cargo: e.target.value }
                                                            })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Salário (R$)</label>
                                                        <input 
                                                            type="number" 
                                                            value={inlineEditingData[employee.id!].salario || 0}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], salario: parseFloat(e.target.value) || 0 }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { salario: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                                                        <select 
                                                            value={inlineEditingData[employee.id!].condominio || ''}
                                                            onChange={(e) => {
                                                                const name = e.target.value;
                                                                const condo = data.condominios.find(c => c.nome === name);
                                                                handleAutoSave(employee.id!, { condominio: name, condominioId: condo?.id });
                                                            }}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none appearance-none"
                                                        >
                                                            <option value="">Selecione um Condomínio</option>
                                                            <option value="Gerente">👔 Gerente</option>
                                                            <option value="Volante">🚗 Volante</option>
                                                            {data.condominios
                                                                .filter(c => c.nome !== 'Sede')
                                                                .sort((a, b) => a.nome.localeCompare(b.nome))
                                                                .map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)
                                                            }
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Admissão</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="DD/MM/YYYY"
                                                            value={inlineEditingData[employee.id!].dataAdmissao || ''}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], dataAdmissao: e.target.value }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { dataAdmissao: e.target.value })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Venc. Férias</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="DD/MM/YYYY"
                                                            value={inlineEditingData[employee.id!].vencimentoFerias || ''}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], vencimentoFerias: e.target.value }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { vencimentoFerias: e.target.value })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Fim Experiência</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="DD/MM/YYYY"
                                                            value={inlineEditingData[employee.id!].fimContratoExperiencia || ''}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], fimContratoExperiencia: e.target.value }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { fimContratoExperiencia: e.target.value })}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações</label>
                                                        <textarea 
                                                            value={inlineEditingData[employee.id!].observacao || ''}
                                                            onChange={(e) => setInlineEditingData({
                                                                ...inlineEditingData,
                                                                [employee.id!]: { ...inlineEditingData[employee.id!], observacao: e.target.value }
                                                            })}
                                                            onBlur={(e) => handleAutoSave(employee.id!, { observacao: e.target.value })}
                                                            rows={2}
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500/30 outline-none resize-none"
                                                            placeholder="Adicione observações..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Status buttons */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Status CLT
                                                </p>
                                                <div className="flex flex-col gap-1.5">
                                                    {(Object.entries(STATUS_MAP) as [RegistrationStatus, RegistrationCategory][]).map(([val, label]) => (
                                                        <button
                                                            key={val}
                                                            disabled={isSaving === employee.id || employee.deleted}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleAutoSave(employee.id!, { statusClt: val });
                                                            }}
                                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${inlineEditingData[employee.id!].statusClt === val ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'} ${employee.deleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {label}
                                                            {inlineEditingData[employee.id!].statusClt === val && <CheckCircle2 className="w-3 h-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                                {inlineEditingData[employee.id!].statusClt === 'nao_vai_registrar' && (
                                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-900/60 rounded-lg border border-amber-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`pode-reg-${employee.id}`}
                                                            checked={inlineEditingData[employee.id!].podeRegistrar || false}
                                                            onChange={(e) => handleAutoSave(employee.id!, { podeRegistrar: e.target.checked })}
                                                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/30 outline-none transition-all cursor-pointer"
                                                        />
                                                        <label htmlFor={`pode-reg-${employee.id}`} className="text-[10px] font-bold text-amber-500 uppercase tracking-tight cursor-pointer select-none">Pode Registrar?</label>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 3: Contracts */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Contratos
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {!employee.deleted ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPrintingContract({ employee, type: 'trabalho' }); }}
                                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                                                        >
                                                            <FileCheck className="w-4 h-4" /> Contrato de Trabalho
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPrintingContract({ employee, type: 'demissao' }); }}
                                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Contrato de Demissão
                                                        </button>
                                                    )}
                                                    <p className="text-[9px] text-slate-600 text-center font-bold italic">Gera documento em A4 pronto para impressão.</p>
                                                </div>
                                            </div>

                                            {/* Column 4: Actions */}
                                            <div className="flex flex-col items-end justify-end gap-3">
                                                {employee.deleted ? (
                                                    <div className="flex gap-2 w-full">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRestore(employee.id!); }}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> Restaurar
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handlePermanentDelete(employee.id!); }}
                                                            className="bg-red-600/20 border border-red-600/30 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-2xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        {/* Saving indicator */}
                                                        {isSaving === employee.id && (
                                                            <div className="flex items-center justify-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest py-2">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
                                                            </div>
                                                        )}
                                                        {/* Trash confirmation flow */}
                                                        {confirmDeleteId === employee.id ? (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest text-center">Mover para lixeira?</p>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(employee.id!); }}
                                                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl transition-all text-[10px] font-black uppercase"
                                                                    >
                                                                        Sim, mover
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl transition-all text-[10px] font-black uppercase"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(employee.id!); }}
                                                                className="w-full bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 text-red-500 py-2.5 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Mover para Lixeira
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : activeCategory === 'Impostos' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Base de Impostos (Template Mensal)</h2>
                            <button 
                                onClick={() => setIsAddImpostoOpen(true)}
                                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-600/20"
                            >
                                <Plus className="w-4 h-4" /> Adicionar Imposto
                            </button>
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Imposto</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Padrão</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {(data.impostos || []).map(imp => (
                                        <tr key={imp.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    defaultValue={imp.nome}
                                                    onBlur={async (e) => {
                                                        if (e.target.value === imp.nome) return;
                                                        const updated = data.impostos.map(i => i.id === imp.id ? { ...i, nome: e.target.value } : i);
                                                        await onSave({ ...data, impostos: updated });
                                                    }}
                                                    className="bg-transparent border-none text-white font-bold focus:ring-1 focus:ring-amber-500 rounded px-1 outline-none w-full"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="number" 
                                                    defaultValue={imp.valor}
                                                    onBlur={async (e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (val === imp.valor) return;
                                                        const updated = data.impostos.map(i => i.id === imp.id ? { ...i, valor: val } : i);
                                                        await onSave({ ...data, impostos: updated });
                                                    }}
                                                    className="bg-transparent border-none text-white font-bold focus:ring-1 focus:ring-amber-500 rounded px-1 outline-none w-32"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={async () => {
                                                        if (!confirm("Excluir imposto?")) return;
                                                        const updated = data.impostos.filter(i => i.id !== imp.id);
                                                        await onSave({ ...data, impostos: updated });
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(data.impostos || []).length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                Nenhum imposto cadastrado na base.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-3xl text-center">
                        <SearchX className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Nenhum resultado</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tente trocar de pasta ou ajustar a busca.</p>
                    </div>
                )}
            </div>


            {/* Add RH Imposto Modal */}
            {isAddImpostoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                                    <Plus className="w-6 h-6 text-amber-400" /> Novo Imposto (Base)
                                </h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Template Mensal</p>
                            </div>
                            <button onClick={() => setIsAddImpostoOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Imposto</label>
                                <input 
                                    type="text" value={newRHImposto.nome} 
                                    onChange={e => setNewRHImposto({...newRHImposto, nome: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                                    placeholder="Ex: INSS, FGTS..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Padrão (R$)</label>
                                <input 
                                    type="number" value={newRHImposto.valor} 
                                    onChange={e => setNewRHImposto({...newRHImposto, valor: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold"
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-800/50 flex gap-4">
                            <button onClick={handleAddRHImposto} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-3xl transition-all shadow-xl shadow-amber-600/20">
                                Cadastrar Imposto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                                    <Plus className="w-6 h-6 text-emerald-400" /> Novo Colaborador
                                </h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cadastro Inicial</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input 
                                        type="text" value={newEmployee.nome} 
                                        onChange={e => setNewEmployee({...newEmployee, nome: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="Digite o nome..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status CLT</label>
                                    <select 
                                        value={newEmployee.statusClt || 'precisa_registrar'} 
                                        onChange={e => setNewEmployee({...newEmployee, statusClt: e.target.value as any})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
                                    >
                                        {Object.entries(STATUS_MAP).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Salário Base (R$)</label>
                                    <input 
                                        type="number" value={newEmployee.salario || 0} 
                                        onChange={e => setNewEmployee({...newEmployee, salario: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                                    <select 
                                        value={newEmployee.condominio || ''} 
                                        onChange={e => {
                                            const name = e.target.value;
                                            const condo = data.condominios.find(c => c.nome === name);
                                            setNewEmployee({...newEmployee, condominio: name, condominioId: condo?.id});
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
                                    >
                                        <option value="">Selecione um Condomínio</option>
                                        <option value="Gerente">👔 Gerente</option>
                                        <option value="Volante">🚗 Volante</option>
                                        <option value="RH">🏢 Equipe RH</option>
                                        {data.condominios
                                            .filter(c => c.nome !== 'Sede')
                                            .sort((a, b) => a.nome.localeCompare(b.nome))
                                            .map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)
                                        }
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimento Férias</label>
                                    <input 
                                        type="text" placeholder="DD/MM/YYYY"
                                        value={newEmployee.vencimentoFerias || ''} 
                                        onChange={e => setNewEmployee({...newEmployee, vencimentoFerias: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Término Experiência</label>
                                    <input 
                                        type="text" placeholder="DD/MM/YYYY"
                                        value={newEmployee.fimContratoExperiencia || ''} 
                                        onChange={e => setNewEmployee({...newEmployee, fimContratoExperiencia: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações</label>
                                    <textarea 
                                        value={newEmployee.observacao || ''} 
                                        onChange={e => setNewEmployee({...newEmployee, observacao: e.target.value})}
                                        rows={2}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                                        placeholder="Observações importantes..."
                                    />
                                </div>
                                {newEmployee.statusClt === 'nao_vai_registrar' && (
                                    <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <input 
                                            type="checkbox" 
                                            id="new-pode-registrar"
                                            checked={newEmployee.podeRegistrar || false}
                                            onChange={e => setNewEmployee({...newEmployee, podeRegistrar: e.target.checked})}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 outline-none cursor-pointer"
                                        />
                                        <label htmlFor="new-pode-registrar" className="text-xs font-bold text-emerald-500 uppercase tracking-tight cursor-pointer">Pode Registrar futuramente?</label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-800/50 flex gap-4">
                            <button onClick={handleAddNew} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-3xl transition-all shadow-xl shadow-emerald-500/20">
                                Cadastrar Colaborador
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Contract Modal */}
            {printingContract && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center py-8 overflow-y-auto no-print">
                    <div className="flex items-center justify-between w-full max-w-4xl px-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                    {printingContract?.type === 'trabalho' ? 'Contrato de Trabalho' : 'Contrato de Demissão'}
                                </h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{printingContract?.employee.nome}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                            >
                                <Printer className="w-5 h-5" /> Imprimir / PDF
                            </button>
                            <button 
                                onClick={() => setPrintingContract(null)}
                                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white text-black p-[2cm] w-[21cm] min-h-[29.7cm] shadow-2xl rounded-sm print:m-0 print:shadow-none print:w-full printable-contract">
                        <div className="flex flex-col items-center mb-10">
                            <div className="flex items-baseline gap-0">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter font-serif">De</span>
                                <span className="text-5xl font-black text-indigo-600 tracking-tighter font-sans">Lucca</span>
                            </div>
                            <div className="text-xl text-indigo-500 -mt-2 italic font-serif">
                                Gestão em Limpeza
                            </div>
                            <div className="w-24 h-1 bg-indigo-600 mt-4"></div>
                        </div>

                        <div className="space-y-8 text-sm leading-relaxed text-justify">
                            <h1 className="text-lg font-black text-center uppercase border-b-2 border-slate-900 pb-2">
                                {printingContract?.type === 'trabalho' ? 'Contrato Individual de Trabalho' : 'Termo de Rescisão de Contrato'}
                            </h1>

                            <div className="space-y-4">
                                <p><strong>EMPREGADOR:</strong> <span className="uppercase font-bold">DELUCCA SERVIÇOS PREDIAIS LTDA</span>, inscrita no CNPJ sob o nº <span className="font-bold">49.909.068/0001-87</span>, com sede na rua 414, Nº 823, Apto. 402, Morretes, Itapema/SC.</p>
                                <p><strong>EMPREGADO(A):</strong> <span className="uppercase font-bold">{printingContract?.employee.nome}</span>, residente e domiciliado(a) em [ENDEREÇO], portador(a) do CPF nº [CPF].</p>
                            </div>

                            {printingContract?.type === 'trabalho' ? (
                                <div className="space-y-6">
                                    <p><strong>Cláusula 1ª:</strong> O(A) EMPREGADO(A) é contratado(a) para exercer a função de <span className="font-bold uppercase">{printingContract?.employee.cargo || 'Auxiliar de Limpeza'}</span>, devendo realizar todas as atividades inerentes ao cargo.</p>
                                    <p><strong>Cláusula 2ª:</strong> A jornada de trabalho será de acordo com as normas da categoria, sendo inicialmente alocada no condomínio <span className="font-bold uppercase">{printingContract?.employee.condominio || 'Sede'}</span>.</p>
                                    <p><strong>Cláusula 3ª:</strong> Pela prestação dos serviços, o(a) EMPREGADO(A) receberá o salário bruto mensal de <span className="font-bold">{formatCurrency(printingContract?.employee.salario || 0)}</span>.</p>
                                    <p><strong>Cláusula 4ª:</strong> O presente contrato tem início em <span className="font-bold">{printingContract?.employee.dataAdmissao || new Date().toLocaleDateString('pt-BR')}</span>.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p>Pelo presente instrumento, a EMPREGADORA comunica a rescisão do contrato de trabalho firmado com o(a) EMPREGADO(A) acima identificado(a).</p>
                                    <p>A rescisão ocorre nesta data, ficando o(a) EMPREGADO(A) ciente de seus direitos e obrigações decorrentes do desligamento.</p>
                                    <p>Data do Desligamento: <span className="font-bold">{new Date().toLocaleDateString('pt-BR')}</span>.</p>
                                </div>
                            )}

                            <div className="pt-20 space-y-20">
                                <div className="text-right italic">
                                    Itapema/SC, {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}.
                                </div>

                                <div className="grid grid-cols-2 gap-20">
                                    <div className="border-t border-slate-900 pt-2 text-center">
                                        <p className="font-bold uppercase text-[10px]">DELUCCA SERVIÇOS PREDIAIS LTDA</p>
                                        <p className="text-[9px]">Empregador</p>
                                    </div>
                                    <div className="border-t border-slate-900 pt-2 text-center">
                                        <p className="font-bold uppercase text-[10px]">{printingContract?.employee.nome}</p>
                                        <p className="text-[9px]">Empregado(a)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            body * { visibility: hidden; }
                            .no-print { display: none !important; }
                            .printable-contract, .printable-contract * { visibility: visible; }
                            .printable-contract {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                margin: 0;
                                padding: 2cm;
                                box-shadow: none !important;
                            }
                            @page { margin: 0; }
                        }
                    `}} />
                </div>
            )}
        </div>
    );
}
