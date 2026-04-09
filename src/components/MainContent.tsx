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
    Zap,
    LineChart,
    FileText,
    HardHat,
    StickyNote,
    TrendingUp,
    Layout
} from 'lucide-react';
import type { Alert } from '@/types';
import type { MonthlyFinanceData, MasterRHData } from '@/modelsFinance';
import { gerarAlertasRH, gerarAlertasCondominios } from '@/lib/alertEngine';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { RHManagerView } from '@/components/RHManagerView';
import { CompanyRHView } from '@/components/CompanyRHView';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { ScheduleView } from '@/components/ScheduleView';
import { ExpenseTrackerView } from './ExpenseTrackerView';
import { PersonalFinanceView } from './PersonalFinanceView';
import { CalculatorsView } from './CalculatorsView';
import { GeneratorsManagerView } from './GeneratorsManagerView';
import PosObrasView from './PosObrasView';
import { NotesView } from './NotesView';
import { Modal } from '@/components/Modal';
import {
    upsertCondominio,
    deleteCondominio,
    createFinanceMonth,
    createEmptyFinanceMonth,
    duplicateFinanceMonth,
    deleteFinanceMonth,
    saveMasterRH,
    saveFinanceMonth,
    getMonthlyFinanceByMonth
} from '../../app/actions';

interface MainContentProps {
    initialCondos: any[];
    initialFinanceMonths: any[];
    initialFuncs: any[];
    initialNotes: any[];
    initialRHImpostos: any[];
}

export default function MainContent({ initialCondos, initialFinanceMonths, initialFuncs, initialNotes, initialRHImpostos }: MainContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'alertas' | 'financeiro' | 'condominios' | 'rh_empresa' | 'geradores' | 'cronograma' | 'gastos' | 'calculos' | 'gestao_pessoal' | 'pos_obras' | 'notas'>('alertas');


    const [masterRH, setMasterRH] = useState<MasterRHData>({
        condominios: initialCondos || [],
        funcionarios: initialFuncs || [],
        impostos: initialRHImpostos || [],
        ultimaAtualizacao: new Date().toISOString()
    });

    const [financeMonths, setFinanceMonths] = useState<MonthlyFinanceData[]>(initialFinanceMonths);

    useEffect(() => {
        setFinanceMonths(initialFinanceMonths);
    }, [initialFinanceMonths]);

    const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
    const [newMonthName, setNewMonthName] = useState("");

    const [duplicateContext, setDuplicateContext] = useState<any>(null); 
    const [dupMonthName, setDupMonthName] = useState("");

    const [importConfirm, setImportConfirm] = useState<{ monthName: string } | null>(null);
    const [startEmpty, setStartEmpty] = useState(false);
    const employeesCount = useMemo(() => masterRH.funcionarios.length, [masterRH.funcionarios]);

    const allEmployeeAlerts = useMemo(() => {
        if (!masterRH.funcionarios || masterRH.funcionarios.length === 0) return [];
        return gerarAlertasRH(masterRH.funcionarios);
    }, [masterRH.funcionarios]);

    const condoAlerts = useMemo(() => {
        return gerarAlertasCondominios(masterRH.condominios || []);
    }, [masterRH.condominios]);

    const financialTotals = useMemo(() => {
        const activeCondos = (masterRH.condominios || []).filter(c => !c.deleted);
        const activeFuncs = (masterRH.funcionarios || []).filter(f => !f.deleted);

        let totalIncome = 0;
        let totalExpenses = 0;

        activeCondos.forEach(condo => {
            const baseValue = condo.valorContrato || 0;
            const inssDeduction = baseValue * 0.13;
            
            const condoEmployees = activeFuncs.filter(f => f.condominioId === condo.id);
            const totalSalaries = condoEmployees.reduce((acc, emp) => acc + (emp.salario || 0), 0);
            const totalEncargos = condoEmployees.reduce((acc, emp) => {
                if (emp.statusClt === 'registrada') {
                    const is22h = condo.cargaHoraria === '22h';
                    return acc + (is22h ? 859 : 1431);
                }
                return acc;
            }, 0);

            totalIncome += baseValue;
            totalExpenses += (inssDeduction + totalSalaries + totalEncargos);
        });

        return {
            income: totalIncome,
            expenses: totalExpenses,
            profit: totalIncome - totalExpenses
        };
    }, [masterRH.condominios, masterRH.funcionarios]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

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
        // ...
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

    const handleImportFromMonth = async () => {
        if (!importConfirm) return;
        
        startTransition(async () => {
            const res = await getMonthlyFinanceByMonth(importConfirm.monthName);
            if (res.success && res.data) {
                const monthData = res.data;
                const updated = { ...masterRH };
                
                monthData.condominios.forEach((mc: any) => {
                    const idx = updated.condominios.findIndex(c => c.nome === mc.nome || (mc.condominioId && c.id === mc.condominioId));
                    if (idx > -1) {
                        updated.condominios[idx] = { 
                            ...updated.condominios[idx], 
                            administradora: mc.administradora,
                            cnpj: mc.cnpj
                        };
                    }
                });

                setMasterRH(updated);
                setImportConfirm(null);
                alert("Dados importados localmente. Lembre-se de clicar em 'Salvar' no Master RH para persistir.");
            } else {
                alert("Erro ao importar: " + res.error);
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
                <nav className="flex-1 overflow-y-auto py-4 hide-scrollbar">
                    <ul className="space-y-1 px-2">
                        <li>
                            <button
                                onClick={() => setActiveTab('alertas')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'alertas' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Briefcase className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Alertas</span>}
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
                                onClick={() => setActiveTab('pos_obras')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'pos_obras' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <HardHat className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Pós-Obras</span>}
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
                                onClick={() => setActiveTab('calculos')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'calculos' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Calculator className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Cálculos Trabalhistas</span>}
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
                        <li>
                            <button
                                onClick={() => setActiveTab('gestao_pessoal')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'gestao_pessoal' ? 'bg-rose-600/10 text-rose-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <LineChart className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Gestão Pessoal</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('notas')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'notas' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <StickyNote className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Notas / Quadro</span>}
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
                    {activeTab === 'alertas' ? (
                        <div className="max-w-7xl mx-auto space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                                        <Users className="w-6 h-6 text-blue-400" />
                                        Alertas de Funcionários
                                    </h2>
                                    
                                    <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                                        {allEmployeeAlerts.length > 0 ? (
                                            allEmployeeAlerts.map(alert => (
                                                <AlertCard key={alert.id} alert={alert} />
                                            ))
                                        ) : (
                                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center italic text-slate-500">
                                                Nenhum alerta pendente para funcionários.
                                            </div>
                                        )}
                                    </div>
                                </section>
                                <section className="space-y-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                                        <Briefcase className="w-6 h-6 text-emerald-400" />
                                        Condomínios e Contratos
                                    </h2>
                                    <div className="space-y-3">
                                        {condoAlerts.length > 0 ? (
                                            condoAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
                                        ) : (
                                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center italic text-slate-500">
                                                Tudo em dia com os contratos.
                                            </div>
                                        )}
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
                    ) : activeTab === 'gestao_pessoal' ? (
                        <PersonalFinanceView />
                    ) : activeTab === 'calculos' ? (
                        <CalculatorsView />
                    ) : activeTab === 'pos_obras' ? (
                        <PosObrasView />
                    ) : activeTab === 'notas' ? (
                        <NotesView initialNotes={initialNotes} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Selecione uma opção no menu lateral
                        </div>
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
                        <div className="space-y-4 p-2 text-slate-300">
                            <div className="text-sm">Deseja importar nomes de administradoras e CNPJs do mês <strong>{importConfirm.monthName}</strong> para o cadastro principal?</div>
                            <div className="text-[10px] text-slate-500 italic">*Isso atualizará os dados localmente, você precisará clicar em salvar no Master RH para persistir.</div>
                            <button 
                                onClick={handleImportFromMonth} 
                                disabled={isPending}
                                className={`w-full text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isPending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                            >
                                {isPending ? 'Importando...' : 'Confirmar Importação'}
                            </button>
                        </div>
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
