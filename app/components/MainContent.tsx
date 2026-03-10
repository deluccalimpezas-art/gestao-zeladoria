'use client'

import React, { useState, useMemo } from 'react';
import {
    Briefcase,
    Users,
    Menu,
    Search,
    PieChart,
    PenTool,
    Receipt,
    CalendarDays // Added CalendarDays icon
} from 'lucide-react';
import type { Alert } from '@/types';
import type { MonthlyFinanceData, MasterRHData } from '@/modelsFinance';
import { gerarAlertasRH, gerarAlertasCondominios } from '@/lib/alertEngine';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { RHManagerView } from '@/components/RHManagerView';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { ContractGeneratorView } from './ContractGeneratorView';
import NFDraftGenerator from './NFDraftGenerator';
import { ScheduleView } from '@/components/ScheduleView'; // Added ScheduleView import
import { Modal } from '@/components/Modal';
import {
    upsertCondominio,
    deleteCondominio,
    createFinanceMonth,
    duplicateFinanceMonth,
    saveMasterRH
} from '../actions';

interface MainContentProps {
    initialCondos: any[];
    initialFinanceMonths: any[];
}

export default function MainContent({ initialCondos, initialFinanceMonths }: MainContentProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'visao_geral' | 'financeiro' | 'rh' | 'documentos' | 'contratos' | 'nf_draft' | 'cronograma'>('visao_geral'); // Added 'cronograma' to activeTab type

    const [masterRH, setMasterRH] = useState<MasterRHData>({
        condominios: initialCondos || [],
        funcionarios: initialCondos?.flatMap((c: any) => c.funcionarios) || [],
        ultimaAtualizacao: new Date().toISOString()
    });

    const [financeMonths] = useState<MonthlyFinanceData[]>(initialFinanceMonths || []);
    const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
    const [newMonthName, setNewMonthName] = useState("");

    const [duplicateContext, setDuplicateContext] = useState<any>(null); // To store { sourceMonthId }
    const [dupMonthName, setDupMonthName] = useState("");

    const [importConfirm, setImportConfirm] = useState<{ monthName: string } | null>(null);

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
        // Here we just log for now, waiting for Prisma Save Logic later on
        console.log("Salvar modificado:", updatedMonth);
    };

    const handleDeleteMonth = async (monthName: string) => {
        if (window.confirm(`Excluir ${monthName}?`)) {
            console.log("Delete month action to be implemented");
        }
    };

    const onCreateMonth = async () => {
        if (!newMonthName.trim()) return alert("Digite um nome para o mês");
        const res = await createFinanceMonth(newMonthName);
        if (res && !res.success) {
            alert('Falha ao criar mês: ' + res.error);
        } else {
            setIsNewMonthModalOpen(false);
        }
    };

    const handleDuplicateMonth = async () => {
        if (!duplicateContext) return;
        if (!dupMonthName.trim()) return alert("Digite um nome para o novo mês duplicado");
        const res = await duplicateFinanceMonth(duplicateContext.sourceMonthId, dupMonthName);
        if (res && !res.success) {
            alert('Falha ao duplicar: ' + res.error);
        } else {
            setDuplicateContext(null);
        }
    };

    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                    {sidebarOpen && <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Secretaria DeLucca</span>}
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
                                onClick={() => setActiveTab('rh')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'rh' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Users className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Base de Dados RH</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('cronograma')} // Added cronograma tab
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
                                onClick={() => setActiveTab('contratos')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'contratos' ? 'bg-rose-600/10 text-rose-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <PenTool className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Gerar Contratos</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('nf_draft')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'nf_draft' ? 'bg-amber-600/10 text-amber-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <Receipt className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Rascunho Nota Fiscal</span>}
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
                        <div className="max-w-7xl mx-auto space-y-6">
                            <h1 className="text-3xl font-bold text-white tracking-tight">Bom dia, Chefe.</h1>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-400" />
                                        Alertas de Funcionários
                                    </h2>
                                    <div className="space-y-3">
                                        {allEmployeeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
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
                            onUpdateMonth={onUpdateCondo}
                            onDuplicateMonth={(month: any) => setDuplicateContext({ sourceMonthId: month.id })}
                            onCreateFromRHBase={() => setIsNewMonthModalOpen(true)}
                            hasRHBase={masterRH.condominios.length > 0}
                        />
                    ) : activeTab === 'rh' ? (
                        <RHManagerView
                            data={masterRH}
                            onSave={async (updated) => {
                                const res = await saveMasterRH(updated);
                                if (res && !res.success) {
                                    alert("Falha ao salvar no banco: " + res.error);
                                } else {
                                    setMasterRH(updated);
                                }
                            }}
                            onImportFromMonth={(monthName) => setImportConfirm({ monthName })}
                            availableMonths={financeMonths.map(m => m.monthName)}
                        />
                    ) : activeTab === 'contratos' ? (
                        <ContractGeneratorView />
                    ) : activeTab === 'nf_draft' ? (
                        <NFDraftGenerator condominios={masterRH.condominios} />
                    ) : (
                        <DocumentGenerator months={financeMonths} />
                    )}
                </div>

                <Modal isOpen={isNewMonthModalOpen} onClose={() => setIsNewMonthModalOpen(false)} title="Criar Novo Mês da Base">
                    <div className="space-y-4 p-4 text-slate-800">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome da Planilha</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Planilha de Novembro, Fechamento 2026..." 
                                value={newMonthName} 
                                onChange={e => setNewMonthName(e.target.value)} 
                                className="w-full border rounded p-2" 
                            />
                        </div>
                        <button onClick={onCreateMonth} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Confirmar Criação</button>
                    </div>
                </Modal>

                <Modal isOpen={!!duplicateContext} onClose={() => setDuplicateContext(null)} title="Duplicar Mês Anterior">
                    <div className="space-y-4 p-4 text-slate-800">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome para o Mês Duplicado (Destino)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Nova Planilha Copiada" 
                                value={dupMonthName} 
                                onChange={e => setDupMonthName(e.target.value)} 
                                className="w-full border rounded p-2" 
                            />
                        </div>
                        <button onClick={handleDuplicateMonth} className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Confirmar Duplicação</button>
                    </div>
                </Modal>

                {importConfirm && (
                    <Modal isOpen={true} onClose={() => setImportConfirm(null)} title="Confirmar Importação">
                        <div className="p-4 text-slate-800">Deseja importar de {importConfirm.monthName}?</div>
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


