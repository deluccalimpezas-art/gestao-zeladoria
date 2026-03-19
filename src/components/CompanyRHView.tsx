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
    Loader2
} from 'lucide-react';
import type { MasterRHData, FuncionarioData } from '../modelsFinance';

interface CompanyRHViewProps {
    data: MasterRHData;
    onSave: (updated: MasterRHData) => Promise<{ success: boolean; error?: string } | void>;
}

type RegistrationStatus = 'registrada' | 'precisa_registrar' | 'em_processo' | 'nao_vai_registrar';
type RegistrationCategory = 'Todos' | 'Registradas' | 'Precisa Registrar' | 'Em Processo' | 'Não vai Registrar';

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

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Mapping function for categories based on user requirements
    const getCategory = (status: string | undefined): RegistrationCategory => {
        if (!status) return 'Precisa Registrar';
        const s = status.toLowerCase();
        if (s.includes('registrada') || s === 'clt') return 'Registradas';
        if (s.includes('nao') || s.includes('não') || s.includes('vai')) return 'Não vai Registrar';
        if (s.includes('precisa') || s.includes('registrar')) return 'Precisa Registrar';
        if (s.includes('processo')) return 'Em Processo';
        return 'Precisa Registrar'; // Default fallback
    };

    const handleStatusChange = async (employeeId: string, newStatus: RegistrationStatus) => {
        setIsSaving(employeeId);
        try {
            const updatedFuncionarios = data.funcionarios.map(f => 
                f.id === employeeId ? { ...f, statusClt: newStatus } : f
            );
            const updatedData = { ...data, funcionarios: updatedFuncionarios };
            const res = await onSave(updatedData);
            if (res && !res.success) {
                alert("Erro ao salvar status: " + res.error);
            }
        } finally {
            setIsSaving(null);
        }
    };

    // Filter for ALL employees
    const employees = useMemo(() => {
        return data.funcionarios.filter(f => {
            const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (f.cargo && f.cargo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 (f.condominio && f.condominio.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = activeCategory === 'Todos' || getCategory(f.statusClt) === activeCategory;
            return matchesSearch && matchesCategory && !f.deleted;
        }).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [data.funcionarios, searchTerm, activeCategory]);

    const categories: { label: RegistrationCategory; icon: any; color: string }[] = [
        { label: 'Todos', icon: Folder, color: 'text-slate-400' },
        { label: 'Registradas', icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Precisa Registrar', icon: Clock, color: 'text-amber-400' },
        { label: 'Em Processo', icon: Briefcase, color: 'text-blue-400' },
        { label: 'Não vai Registrar', icon: UserMinus, color: 'text-rose-400' },
    ];

    const statsByCategory = useMemo(() => {
        const counts: Record<RegistrationCategory, number> = {
            'Todos': 0, 'Registradas': 0, 'Precisa Registrar': 0, 'Em Processo': 0, 'Não vai Registrar': 0
        };
        
        const allActive = data.funcionarios.filter(f => !f.deleted);
        counts['Todos'] = allActive.length;
        allActive.forEach(f => {
            const cat = getCategory(f.statusClt);
            counts[cat]++;
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
            {/* Header / Hero Section (Slimmer for List View) */}
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
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400/80">Gestão Global de Registro</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">RH da Empresa</h1>
                        <p className="text-slate-400 mt-1 max-w-lg text-sm leading-relaxed">
                            Controle unificado de {data.funcionarios.length} colaboradores, organizado por grupos de registro administrativo.
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

            {/* Folders / Categories */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/20 border border-slate-700/50 rounded-3xl overflow-hidden shadow-inner">
                {categories.map((cat) => (
                    <button
                        key={cat.label}
                        onClick={() => setActiveCategory(cat.label)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest group ${activeCategory === cat.label ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}
                    >
                        {activeCategory === cat.label ? <FolderOpen className="w-4 h-4" /> : <cat.icon className={`w-4 h-4 ${cat.color}`} />}
                        {cat.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeCategory === cat.label ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                            {statsByCategory[cat.label]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Controls & Search */}
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
                
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                    <Plus className="w-5 h-5 shadow-sm" /> Novo Cadastro
                </button>
            </div>

            {/* Employee List (Rows) */}
            <div className="space-y-3 pb-12">
                {employees.length > 0 ? (
                    employees.map((employee: FuncionarioData) => {
                        const isExpanded = employee.id ? expandedRows.has(employee.id) : false;
                        const category = getCategory(employee.statusClt);
                        
                        return (
                            <div key={employee.id || Math.random()} className="group overflow-hidden">
                                {/* Row Header */}
                                <div 
                                    onClick={() => employee.id && toggleRow(employee.id)}
                                    className={`relative flex items-center justify-between p-4 bg-slate-800/30 border ${isExpanded ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-700/50 hover:bg-slate-800/60'} rounded-3xl transition-all cursor-pointer select-none`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-2.5 rounded-xl border ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-indigo-400'} transition-all`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 flex-1">
                                            <div className="min-w-[200px]">
                                                <h3 className="font-black text-white uppercase tracking-tight truncate">{employee.nome}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-widest min-w-[150px]">
                                                <Briefcase className="w-3.5 h-3.5 opacity-40" />
                                                {employee.cargo || 'Staff'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest truncate min-w-[150px]">
                                                <Building className="w-3.5 h-3.5 opacity-40" />
                                                {employee.condominio || 'Sede'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${category === 'Registradas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : category === 'Precisa Registrar' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                            {category}
                                        </span>
                                        <div className={`p-1 rounded-lg text-slate-500 group-hover:text-white transition-all ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Content */}
                                {isExpanded && employee.id && (
                                    <div className="mx-6 px-8 py-6 bg-slate-800/40 border-x border-b border-indigo-500/20 rounded-b-[2rem] -mt-4 pt-10 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                            <div className="space-y-4">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Status CLT (Troque Aqui)
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {(Object.entries(STATUS_MAP) as [RegistrationStatus, RegistrationCategory][]).map(([val, label]) => (
                                                        <button
                                                            key={val}
                                                            disabled={isSaving === employee.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (employee.id) handleStatusChange(employee.id, val);
                                                            }}
                                                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${employee.statusClt === val ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                                        >
                                                            {label}
                                                            {employee.statusClt === val && <CheckCircle2 className="w-3 h-3" />}
                                                            {isSaving === employee.id && employee.statusClt !== val && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Remuneração
                                                </p>
                                                <p className="text-lg font-black text-white">{formatCurrency(employee.salario || 0)}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Admissão
                                                </p>
                                                <p className="text-lg font-black text-slate-300">{employee.dataAdmissao || '--/--/----'}</p>
                                            </div>
                                            <div className="flex flex-col items-end justify-end gap-3">
                                                <button className="w-full bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                                    Ver Holerite
                                                </button>
                                                <div className="flex gap-2 w-full">
                                                    <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest">
                                                        Editar Perfil
                                                    </button>
                                                    <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-3 rounded-2xl transition-all">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-3xl text-center">
                        <div className="inline-flex p-4 bg-slate-800 rounded-full mb-4">
                            <SearchX className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum resultado em "{activeCategory}"</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Tente trocar de pasta ou ajustar sua pesquisa.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
