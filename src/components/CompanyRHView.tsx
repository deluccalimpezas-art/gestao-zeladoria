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
    FileText
} from 'lucide-react';
import type { MasterRHData, FuncionarioData, CondominioData } from '../modelsFinance';

interface CompanyRHViewProps {
    data: MasterRHData;
    onSave: (updated: MasterRHData) => Promise<{ success: boolean; error?: string } | void>;
}

type RegistrationStatus = 'registrada' | 'precisa_registrar' | 'em_processo' | 'nao_vai_registrar';
type RegistrationCategory = 'Todos' | 'Registradas' | 'Precisa Registrar' | 'Em Processo' | 'Não vai Registrar' | 'Lixeira';

const STATUS_MAP: Record<RegistrationStatus, RegistrationCategory> = {
    'registrada': 'Registradas',
    'precisa_registrar': 'Precisa Registrar',
    'em_processo': 'Em Processo',
    'nao_vai_registrar': 'Não vai Registrar'
};

export function CompanyRHView({ data, onSave }: CompanyRHViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<RegistrationCategory>('Todos');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState<string | null>(null);
    
    // Estados de edição
    const [inlineEditingData, setInlineEditingData] = useState<Record<string, FuncionarioData>>({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Partial<FuncionarioData>>({
        nome: '',
        cargo: '',
        salario: 0,
        totalReceber: 0,
        statusClt: 'precisa_registrar',
        condominio: ''
    });

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
        if (s.includes('registrada') || s === 'clt') return 'Registradas';
        if (s.includes('nao') || s.includes('não') || s.includes('vai')) return 'Não vai Registrar';
        if (s.includes('precisa') || s.includes('registrar')) return 'Precisa Registrar';
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
        if (!confirm("Mover para a lixeira?")) return;
        const updatedFuncionarios = data.funcionarios.map(f => 
            f.id === employeeId ? { ...f, deleted: true } : f
        );
        await onSave({ ...data, funcionarios: updatedFuncionarios });
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

    const handleInlineSave = async (employeeId: string) => {
        const editData = inlineEditingData[employeeId];
        if (!editData) return;
        
        setIsSaving(employeeId);
        try {
            const updatedFuncionarios = data.funcionarios.map(f => 
                f.id === employeeId ? editData : f
            );
            await onSave({ ...data, funcionarios: updatedFuncionarios });
            
            // Fechar a linha após salvar (opcional, mas o usuário pediu "clicar para abrir e já editar")
            // Vamos manter aberta mas sinalizar sucesso visualmente se necessário. 
            // Para simplicidade, apenas mantemos aberta.
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
            dataAdmissao: newEmployee.dataAdmissao || '',
            deleted: false
        };
        const res = await onSave({ ...data, funcionarios: [fresh, ...data.funcionarios] });
        if (!res || res.success) {
            setIsAddModalOpen(false);
            setNewEmployee({ nome: '', cargo: '', salario: 0, statusClt: 'precisa_registrar', condominio: '' });
        }
    };

    const employees = useMemo(() => {
        return data.funcionarios.filter(f => {
            const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (f.cargo && f.cargo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 (f.condominio && f.condominio.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (activeCategory === 'Lixeira') return f.deleted && matchesSearch;
            if (f.deleted) return false;
            
            const matchesCategory = activeCategory === 'Todos' || getCategory(f.statusClt) === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [data.funcionarios, searchTerm, activeCategory]);

    const categories: { label: RegistrationCategory; icon: any; color: string }[] = [
        { label: 'Todos', icon: Folder, color: 'text-slate-400' },
        { label: 'Registradas', icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Precisa Registrar', icon: Clock, color: 'text-amber-400' },
        { label: 'Em Processo', icon: Briefcase, color: 'text-blue-400' },
        { label: 'Não vai Registrar', icon: UserMinus, color: 'text-rose-400' },
        { label: 'Lixeira', icon: Trash2, color: 'text-red-400' },
    ];

    const statsByCategory = useMemo(() => {
        const counts: Record<RegistrationCategory, number> = {
            'Todos': 0, 'Registradas': 0, 'Precisa Registrar': 0, 'Em Processo': 0, 'Não vai Registrar': 0, 'Lixeira': 0
        };
        data.funcionarios.forEach(f => {
            if (f.deleted) {
                counts['Lixeira']++;
            } else {
                counts['Todos']++;
                counts[getCategory(f.statusClt)]++;
            }
        });
        return counts;
    }, [data.funcionarios]);

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
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 shadow-sm" /> Novo Cadastro
                </button>
            </div>

            {/* List */}
            <div className="space-y-3 pb-12">
                {employees.length > 0 ? (
                    employees.map((employee: FuncionarioData) => {
                        const isExpanded = employee.id ? expandedRows.has(employee.id) : false;
                        const category = getCategory(employee.statusClt);
                        
                        return (
                            <div key={employee.id} className="group overflow-hidden">
                                <div 
                                    onClick={() => employee.id && toggleRow(employee.id)}
                                    className={`relative flex items-center justify-between p-4 bg-slate-800/30 border ${isExpanded ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-700/50 hover:bg-slate-800/60'} rounded-3xl transition-all cursor-pointer select-none`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-2.5 rounded-xl border ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-indigo-400'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                            <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr] items-center gap-4 flex-1">
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
                                            </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {employee.deleted ? (
                                            <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">Lixeira</span>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${category === 'Registradas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : category === 'Precisa Registrar' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                                {category}
                                            </span>
                                        )}
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
                                                                setInlineEditingData({
                                                                    ...inlineEditingData,
                                                                    [employee.id!]: { ...inlineEditingData[employee.id!], condominio: name, condominioId: condo?.id }
                                                                });
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
                                                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
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
                                                                setInlineEditingData({
                                                                    ...inlineEditingData,
                                                                    [employee.id!]: { ...inlineEditingData[employee.id!], statusClt: val }
                                                                });
                                                            }}
                                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${inlineEditingData[employee.id!].statusClt === val ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'} ${employee.deleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {label}
                                                            {inlineEditingData[employee.id!].statusClt === val && <CheckCircle2 className="w-3 h-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 4: Actions */}
                                            <div className="flex flex-col items-end justify-end gap-3">
                                                {employee.deleted ? (
                                                    <div className="flex gap-2 w-full">
                                                        <button 
                                                            onClick={() => handleRestore(employee.id!)}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> Restaurar
                                                        </button>
                                                        <button 
                                                            onClick={() => handlePermanentDelete(employee.id!)}
                                                            className="bg-red-600/20 border border-red-600/30 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-2xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3 w-full">
                                                        <button 
                                                            onClick={() => handleInlineSave(employee.id!)}
                                                            disabled={isSaving === employee.id}
                                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl transition-all text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isSaving === employee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                            Salvar Alterações
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(employee.id!)}
                                                            className="w-full bg-red-500/5 border border-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2.5 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Mover para Lixeira
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-3xl text-center">
                        <SearchX className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Nenhum resultado</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tente trocar de pasta ou ajustar a busca.</p>
                    </div>
                )}
            </div>


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
                                <div className="space-y-2 hidden">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo / Função</label>
                                    <input 
                                        type="text" value={newEmployee.cargo || ''} 
                                        onChange={e => setNewEmployee({...newEmployee, cargo: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="Ex: Auxiliar de Limpeza"
                                    />
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
                                        onChange={e => setNewEmployee({...newEmployee, condominio: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
                                    >
                                        <option value="">Selecione um Condomínio</option>
                                        <option value="Gerente">Gerente</option>
                                        <option value="Volante">Volante</option>
                                        {data.condominios
                                            .filter(c => c.nome !== 'Sede')
                                            .sort((a, b) => a.nome.localeCompare(b.nome))
                                            .map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)
                                        }
                                    </select>
                                </div>
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
        </div>
    );
}
