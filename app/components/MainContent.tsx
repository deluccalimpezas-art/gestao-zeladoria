'use client'

import React, { useState, useMemo } from 'react';
import {
    Briefcase,
    Users,
    Menu,
    Search,
    PieChart
} from 'lucide-react';
import type { Alert } from '@/types';
import type { MonthlyFinanceData, MasterRHData } from '@/modelsFinance';
import { gerarAlertasRH, gerarAlertasCondominios } from '@/lib/alertEngine';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { RHManagerView } from '@/components/RHManagerView';
import { DocumentGenerator } from '@/components/DocumentGenerator';
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
    const [activeTab, setActiveTab] = useState<'visao_geral' | 'financeiro' | 'rh' | 'documentos'>('visao_geral');

    const [masterRH, setMasterRH] = useState<MasterRHData>({
        condominios: initialCondos || [],
        funcionarios: initialCondos?.flatMap((c: any) => c.funcionarios) || [],
        ultimaAtualizacao: new Date().toISOString()
    });

    const [financeMonths] = useState<MonthlyFinanceData[]>(initialFinanceMonths || []);
    const [isUploadingExcel] = useState(false);
    const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
    const [newMesInput, setNewMesInput] = useState(new Date().getMonth() + 1);
    const [newAnoInput, setNewAnoInput] = useState(new Date().getFullYear());

    const [duplicateContext, setDuplicateContext] = useState<any>(null); // To store { sourceMonthId, mes, ano }
    const [dupMesInput, setDupMesInput] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2);
    const [dupAnoInput, setDupAnoInput] = useState(new Date().getMonth() + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear());

    const [importConfirm, setImportConfirm] = useState<{ monthName: string } | null>(null);

    const employeesCount = useMemo(() => masterRH.funcionarios.length, [masterRH.funcionarios]);

    const allEmployeeAlerts = useMemo(() => {
        if (!masterRH.funcionarios || masterRH.funcionarios.length === 0) return [];
        return gerarAlertasRH(masterRH.funcionarios);
    }, [masterRH.funcionarios]);

    const condoAlerts = useMemo(() => {
        return gerarAlertasCondominios(masterRH.condominios || []);
    }, [masterRH.condominios]);

    const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("Upload logic to be connected");
    };

    const onUpdateCondo = async (data: any) => {
        await upsertCondominio(data);
    };

    const onDeleteCondo = async (id: string) => {
        if (window.confirm('Excluir condomínio?')) {
            await deleteCondominio(id);
        }
    };

    const handleDeleteMonth = async (monthName: string, year: number) => {
        if (window.confirm(`Excluir ${monthName}/${year}?`)) {
            console.log("Delete month action to be implemented");
        }
    };

    const onCreateMonth = async () => {
        const res = await createFinanceMonth(newMesInput, newAnoInput);
        if (res && !res.success) {
            alert('Falha ao criar mês: ' + res.error);
        } else {
            setIsNewMonthModalOpen(false);
        }
    };

    const handleDuplicateMonth = async () => {
        if (!duplicateContext) return;
        const res = await duplicateFinanceMonth(duplicateContext.sourceMonthId, dupMesInput, dupAnoInput);
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
                                onClick={() => setActiveTab('financeiro')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'financeiro' ? 'bg-emerald-600/10 text-emerald-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                            >
                                <PieChart className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium">Financeiro</span>}
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
                            onUpload={handleExcelUpload}
                            isUploading={isUploadingExcel}
                            onDeleteMonth={handleDeleteMonth}
                            onUpdateMonth={onUpdateCondo}
                            onDuplicateMonth={(month: any) => setDuplicateContext({ sourceMonthId: month.id, mes: dupMesInput, ano: dupAnoInput })}
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
                    ) : (
                        <DocumentGenerator months={financeMonths} />
                    )}
                </div>

                <Modal isOpen={isNewMonthModalOpen} onClose={() => setIsNewMonthModalOpen(false)} title="Criar Novo Mês da Base">
                    <div className="space-y-4 p-4 text-slate-800">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Mês (Numérico)</label>
                                <input type="number" min="1" max="12" value={newMesInput} onChange={e => setNewMesInput(Number(e.target.value))} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Ano</label>
                                <input type="number" value={newAnoInput} onChange={e => setNewAnoInput(Number(e.target.value))} className="w-full border rounded p-2" />
                            </div>
                        </div>
                        <button onClick={onCreateMonth} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Confirmar Criação</button>
                    </div>
                </Modal>

                <Modal isOpen={!!duplicateContext} onClose={() => setDuplicateContext(null)} title="Duplicar Mês Anterior">
                    <div className="space-y-4 p-4 text-slate-800">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Novo Mês (Destino)</label>
                                <input type="number" min="1" max="12" value={dupMesInput} onChange={e => setDupMesInput(Number(e.target.value))} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Ano (Destino)</label>
                                <input type="number" value={dupAnoInput} onChange={e => setDupAnoInput(Number(e.target.value))} className="w-full border rounded p-2" />
                            </div>
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


