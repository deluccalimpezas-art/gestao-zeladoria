'use client'

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Building2,
    Users,
    Menu,
    Search,
    PieChart,
    PenTool,
    Receipt,
    Wallet,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Calculator,
    Trash2,
    Zap
} from 'lucide-react';
import type { Alert } from '@/types';
import type { MonthlyFinanceData, MasterRHData } from '@/modelsFinance';
import { gerarAlertasRH, gerarAlertasCondominios } from '@/lib/alertEngine';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { RHManagerView } from '@/components/RHManagerView';
import { CompanyRHView } from '@/components/CompanyRHView';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { ScheduleView } from '@/components/ScheduleView';
import { GeneratorsManagerView } from './GeneratorsManagerView';
import { Modal } from '@/components/Modal';
import {
    upsertCondominio,
    deleteCondominio,
    createFinanceMonth,
    createEmptyFinanceMonth,
    duplicateFinanceMonth,
    deleteFinanceMonth,
    saveMasterRH,
    saveFinanceMonth
} from '../../app/actions';

interface MainContentProps {
    initialCondos: any[];
    initialFinanceMonths: any[];
    initialFuncs: any[];
}

export default function MainContent({ initialCondos, initialFinanceMonths, initialFuncs }: MainContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'visao_geral' | 'financeiro' | 'condominios' | 'rh_empresa' | 'documentos' | 'geradores' | 'cronograma'>('visao_geral');

    const [masterRH, setMasterRH] = useState<MasterRHData>({
        condominios: initialCondos || [],
        funcionarios: initialFuncs || [],
        ultimaAtualizacao: new Date().toISOString()
    });

    const [financeMonths, setFinanceMonths] = useState<MonthlyFinanceData[]>(initialFinanceMonths);

    useEffect(() => {
        setFinanceMonths(initialFinanceMonths);
    }, [initialFinanceMonths]);

    const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
    const [newMonthName, setNewMonthName] = useState("");

    const [duplicateContext, setDuplicateContext] = useState<any>(null); // To store { sourceMonthId }
    const [dupMonthName, setDupMonthName] = useState("");

    const [importConfirm, setImportConfirm] = useState<{ monthName: string } | null>(null);
    const [startEmpty, setStartEmpty] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        registro: false,
        experiencia: false,
        ferias: false
    });

    const toggleFolder = (folder: string) => {
        setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
    };

    const employeesCount = useMemo(() => masterRH.funcionarios.length, [masterRH.funcionarios]);

    const allEmployeeAlerts = useMemo(() => {
        if (!masterRH.funcionarios || masterRH.funcionarios.length === 0) return [];
        return gerarAlertasRH(masterRH.funcionarios);
    }, [masterRH.funcionarios]);

    const condoAlerts = useMemo(() => {
        return gerarAlertasCondominios(masterRH.condominios || []);
    }, [masterRH.condominios]);

    const onUpdateCondo = async (data: any) => {
        await upsertCondominio(data);
    };

    const onDeleteCondo = async (id: string) => {
        if (window.confirm('Excluir condomínio?')) {
            await deleteCondominio(id);
        }
    };

    const onUpdateMonth = async (updatedMonth: MonthlyFinanceData) => {
        const res = await saveFinanceMonth(updatedMonth);
        if (res && !res.success) {
            alert("Erro ao salvar mês: " + res.error);
        } else {
            setFinanceMonths(prev => prev.map(m => m.id === updatedMonth.id ? updatedMonth : m));
        }
        return res;
    };

    const handleDeleteMonth = async (monthName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir permanentemente o mês "${monthName}"? Esta ação não pode ser desfeita.`)) {
            startTransition(async () => {
                const res = await deleteFinanceMonth(monthName);
                if (res && !res.success) {
                    alert('Falha ao excluir mês: ' + res.error);
                } else {
                    router.refresh();
                }
            });
        }
    };

    const onCreateMonth = async () => {
        if (!newMonthName.trim()) return alert("Digite um nome para o mês");
        
        startTransition(async () => {
            const res = startEmpty 
                ? await createEmptyFinanceMonth(newMonthName)
                : await createFinanceMonth(newMonthName);
                
            if (res && !res.success) {
                alert('Falha ao criar mês: ' + res.error);
            } else {
                setIsNewMonthModalOpen(false);
                setNewMonthName("");
                setStartEmpty(false);
                router.refresh();
            }
        });
    };

    const handleRenameMonth = async (oldName: string, newName: string) => {
        // Implementação simples: poderíamos ter um action rename, 
        // mas por enquanto vamos focar no que o usuário pediu: duplicar e mudar nome da cópia.
    };

    const handleDuplicateMonth = async () => {
        if (!duplicateContext) return;
        if (!dupMonthName.trim()) return alert("Digite um nome para o novo mês duplicado");
        
        startTransition(async () => {
            const res = await duplicateFinanceMonth(duplicateContext.sourceMonthId, dupMonthName);
            if (res && !res.success) {
                alert('Falha ao duplicar: ' + res.error);
            } else {
                setDuplicateContext(null);
                setDupMonthName("");
                router.refresh();
            }
        });
    };

    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                    {sidebarOpen && (
                        <div className="flex flex-col items-center flex-1">
                            <div className="flex items-baseline gap-0 transform scale-75 origin-left">
                                <span className="text-2xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                <span className="text-2xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                            </div>
                            <div className="text-[12px] text-[#00CEE4] -mt-2 italic font-serif">
                                Gestão em Limpeza
                            </div>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        <li>
                            <button
                                onClick={() => setActiveTab('visao_geral')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'visao_geral' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Briefcase className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Visão Geral (RH)</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('cronograma')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'cronograma' ? 'bg-purple-600/10 text-purple-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <CalendarDays className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Cronograma</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('financeiro')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'financeiro' ? 'bg-emerald-600/10 text-emerald-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <PieChart className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Financeiro</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('geradores')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'geradores' ? 'bg-amber-600/10 text-amber-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Zap className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Geradores</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('condominios')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'condominios' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Building2 className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Condomínios</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('rh_empresa')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'rh_empresa' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Users className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">RH da Empresa</span>}
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center bg-slate-900 rounded-full px-4 py-2 border border-slate-700 w-96">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="Pesquisar..." className="bg-transparent border-none outline-none text-sm w-full text-slate-200" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'visao_geral' ? (
                        <div className="max-w-7xl mx-auto space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="text-3xl font-bold text-white tracking-tight">Olá, Eduardo</h1>
                                <div className="flex gap-4">
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-lg backdrop-blur-sm">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Condomínios</p>
                                            <p className="text-xl font-black text-white">{masterRH.condominios.length}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-lg backdrop-blur-sm">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Funcionários</p>
                                            <p className="text-xl font-black text-white">{employeesCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                                        <Users className="w-6 h-6 text-blue-400" />
                                        Alertas de Funcionários
                                    </h2>
                                    
                                    {/* Pasta: Fazer Registro */}
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => toggleFolder('registro')}
                                            className="w-full text-sm font-black uppercase tracking-wider text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2 hover:bg-slate-700/50 transition-colors"
                                        >
                                            {expandedFolders.registro ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                            <PenTool className="w-4 h-4 text-amber-500" />
                                            Fazer Registro
                                            <span className="ml-auto bg-slate-900 px-2 py-0.5 rounded text-[10px]">{allEmployeeAlerts.filter(a => a.id.includes('rh-registro')).length}</span>
                                        </button>
                                        {expandedFolders.registro && (
                                            <div className="space-y-3 pl-2 animate-in slide-in-from-top-2 duration-200">
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-registro')).map(alert => <AlertCard key={alert.id} alert={alert} />)}
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-registro')).length === 0 && (
                                                    <p className="text-xs text-slate-600 italic pl-2">Nenhum registro pendente.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pasta: Contrato de Experiência */}
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => toggleFolder('experiencia')}
                                            className="w-full text-sm font-black uppercase tracking-wider text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2 hover:bg-slate-700/50 transition-colors"
                                        >
                                            {expandedFolders.experiencia ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                            <Briefcase className="w-4 h-4 text-rose-500" />
                                            Vencendo Contrato de Experiência
                                            <span className="ml-auto bg-slate-900 px-2 py-0.5 rounded text-[10px]">{allEmployeeAlerts.filter(a => a.id.includes('rh-contrato')).length}</span>
                                        </button>
                                        {expandedFolders.experiencia && (
                                            <div className="space-y-3 pl-2 animate-in slide-in-from-top-2 duration-200">
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-contrato')).map(alert => <AlertCard key={alert.id} alert={alert} />)}
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-contrato')).length === 0 && (
                                                    <p className="text-xs text-slate-600 italic pl-2">Nenhum contrato vencendo.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pasta: Férias */}
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => toggleFolder('ferias')}
                                            className="w-full text-sm font-black uppercase tracking-wider text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2 hover:bg-slate-700/50 transition-colors"
                                        >
                                            {expandedFolders.ferias ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                            <CalendarDays className="w-4 h-4 text-emerald-500" />
                                            Vencendo as Férias
                                            <span className="ml-auto bg-slate-900 px-2 py-0.5 rounded text-[10px]">{allEmployeeAlerts.filter(a => a.id.includes('rh-ferias') || a.id.includes('rh-aniversario')).length}</span>
                                        </button>
                                        {expandedFolders.ferias && (
                                            <div className="space-y-3 pl-2 animate-in slide-in-from-top-2 duration-200">
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-ferias') || a.id.includes('rh-aniversario')).map(alert => <AlertCard key={alert.id} alert={alert} />)}
                                                {allEmployeeAlerts.filter(a => a.id.includes('rh-ferias') || a.id.includes('rh-aniversario')).length === 0 && (
                                                    <p className="text-xs text-slate-600 italic pl-2">Nenhuma férias vencendo.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-emerald-400" />
                                        Condomínios e Contratos
                                    </h2>
                                    <div className="space-y-3">
                                        {condoAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : activeTab === 'financeiro' ? (
                        <FinanceDashboard
                            monthsData={financeMonths}
                            employeesCount={employeesCount}
                            onDeleteMonth={handleDeleteMonth}
                            onUpdateMonth={onUpdateMonth}
                            onDuplicateMonth={(month: any) => setDuplicateContext({ sourceMonthId: month.id })}
                            onCreateFromRHBase={() => setIsNewMonthModalOpen(true)}
                            hasRHBase={masterRH.condominios.length > 0}
                        />
                    ) : activeTab === 'condominios' ? (
                        <RHManagerView
                            data={masterRH}
                            onSave={async (updated) => {
                                // Sanitização: Resolve IDs de condomínios por nome se faltarem
                                const sanitizedFuncs = updated.funcionarios.map(f => {
                                    if (!f.condominioId && f.condominio && f.condominio !== 'Sede' && f.condominio !== 'Gerente' && f.condominio !== 'Volante') {
                                        const condo = updated.condominios.find(c => c.nome === f.condominio);
                                        if (condo) return { ...f, condominioId: condo.id };
                                    }
                                    return f;
                                });
                                const finalData = { ...updated, funcionarios: sanitizedFuncs };
                                const res = await saveMasterRH(finalData);
                                if (res && !res.success) {
                                    alert("Falha ao salvar no banco: " + res.error);
                                } else {
                                    setMasterRH(finalData);
                                }
                                return res;
                            }}
                            onImportFromMonth={(monthName) => setImportConfirm({ monthName })}
                            availableMonths={financeMonths.map(m => m.monthName)}
                        />
                    ) : activeTab === 'rh_empresa' ? (
                        <CompanyRHView
                            data={masterRH}
                            onSave={async (updated) => {
                                const res = await saveMasterRH(updated);
                                if (res && !res.success) {
                                    alert("Falha ao salvar no banco: " + res.error);
                                } else {
                                    setMasterRH(updated);
                                }
                                return res;
                            }}
                        />
                    ) : activeTab === 'cronograma' ? (
                        <ScheduleView />
                    ) : activeTab === 'geradores' ? (
                        <GeneratorsManagerView employees={masterRH.funcionarios} condominios={masterRH.condominios} />
                    ) : (
                        <DocumentGenerator months={financeMonths} />
                    )}
                </div>

                <Modal isOpen={isNewMonthModalOpen} onClose={() => setIsNewMonthModalOpen(false)} title="Criar Novo Mês da Base">
                    <div className="space-y-4 p-2 text-slate-300">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Nome da Planilha</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Planilha de Novembro, Fechamento 2026..." 
                                value={newMonthName} 
                                onChange={e => setNewMonthName(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            />
                        </div>
                        <div className="flex items-center gap-2 px-1">
                            <input 
                                type="checkbox" 
                                id="startEmpty"
                                checked={startEmpty}
                                onChange={e => setStartEmpty(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/50"
                            />
                            <label htmlFor="startEmpty" className="text-sm text-slate-400">Começar com planilha em branco (sem copiar base RH)</label>
                        </div>
                        <button 
                            onClick={onCreateMonth} 
                            disabled={isPending}
                            className={`w-full text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isPending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                        >
                            {isPending ? 'Criando...' : 'Confirmar Criação'}
                        </button>
                    </div>
                </Modal>

                <Modal isOpen={!!duplicateContext} onClose={() => setDuplicateContext(null)} title="Duplicar Mês Anterior">
                    <div className="space-y-4 p-2 text-slate-300">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Nome para o Mês Duplicado (Destino)</label>
                            <input
                                type="text"
                                placeholder="Ex: Planilha de Dezembro..."
                                value={dupMonthName}
                                autoFocus
                                onChange={e => setDupMonthName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <button 
                            onClick={handleDuplicateMonth} 
                            disabled={isPending}
                            className={`w-full text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isPending ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}
                        >
                            {isPending ? 'Duplicando...' : 'Confirmar Duplicação'}
                        </button>
                    </div>
                </Modal>

                {importConfirm && (
                    <Modal isOpen={true} onClose={() => setImportConfirm(null)} title="Confirmar Importação">
                        <div className="p-4 text-slate-300">Deseja importar de {importConfirm.monthName}?</div>
                    </Modal>
                )}
            </main>
        </div>
    );
}

function AlertCard({ alert }: { alert: Alert }) {
    const color = alert.type === 'ferias' ? 'amber' : alert.type === 'contrato' ? (alert.category === 'condominio' ? 'emerald' : 'red') : 'blue';
    return (
        <div className={`bg-slate-800 border-l-4 border-${color}-500 rounded-xl p-5 shadow-lg`}>
            <h3 className="text-base font-bold text-white">{alert.title}</h3>
            <p className="text-xs text-slate-400">{alert.description}</p>
        </div>
    );
}


