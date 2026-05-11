'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { 
    CalendarDays, 
    Printer, 
    Building2, 
    Save, 
    Wand2, 
    Plus, 
    Trash2, 
    Copy,
    GripVertical,
    Clock,
    CheckCircle2,
    Users,
    LibraryBig,
    ArrowLeft
} from 'lucide-react';
import { saveCleaningSchedule, deleteCleaningSchedule, getCleaningSchedules, duplicateCleaningSchedule } from '../../app/actions';

// Constantes
const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const LAZER_OPCOES = [
    "Academia",
    "Salão de Jogos",
    "Pub",
    "Salão de Festas",
    "Cinema",
    "Brinquedoteca",
    "Piscina",
    "Churrasqueira",
    "Sauna",
    "Coworking",
    "Playground",
    "Spa"
];

export function CleaningScheduleView() {
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'generator' | 'saved'>('generator');
    const [schedules, setSchedules] = useState<any[]>([]);
    const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

    // Form State
    const [nomeCondominio, setNomeCondominio] = useState('');
    const [numFuncionarias, setNumFuncionarias] = useState(1);
    const [cargaHoraria, setCargaHoraria] = useState('44h');
    const [areas, setAreas] = useState<string[]>([]);
    const [novaArea, setNovaArea] = useState('');
    const [observacoes, setObservacoes] = useState('');
    
    // Generated Schedule State
    const [scheduleData, setScheduleData] = useState<any>(null);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        const data = await getCleaningSchedules();
        setSchedules(data || []);
    };

    const toggleArea = (area: string) => {
        if (areas.includes(area)) {
            setAreas(areas.filter(a => a !== area));
        } else {
            setAreas([...areas, area]);
        }
    };

    const addCustomArea = () => {
        if (novaArea.trim() && !areas.includes(novaArea.trim())) {
            setAreas([...areas, novaArea.trim()]);
            setNovaArea('');
        }
    };

    const generateSchedule = () => {
        const newSchedule: any = { dias: [] };

        const areasLazer = [...areas];
        const lazerPorDia = Array.from({ length: 6 }, () => [] as string[]);
        
        let diaIdx = 0;
        areasLazer.forEach(area => {
            lazerPorDia[diaIdx].push(area);
            diaIdx = (diaIdx + 1) % 6; 
        });

        // 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sab
        for (let i = 0; i < 6; i++) {
            const diaSemana = DIAS_SEMANA[i];
            
            const funcionarias = Array.from({ length: numFuncionarias }, (_, idx) => ({
                id: idx + 1,
                nome: numFuncionarias === 1 ? 'Funcionária 1 (Rotina Completa)' : `Funcionária ${idx + 1}`,
                tarefas: [] as string[]
            }));

            const addTo1 = (t: string) => { funcionarias[0].tarefas.push(t); }
            const addTo2 = (t: string) => { if(numFuncionarias > 1) funcionarias[1].tarefas.push(t); else addTo1(t); }
            const addToAll = (t: string) => { funcionarias.forEach(f => f.tarefas.push(t)); }
            const addDivided = (t: string) => { 
                if (numFuncionarias === 1) addTo1(t);
                else {
                    funcionarias.forEach((f, idx) => f.tarefas.push(`${t} (Parte ${idx + 1}/${numFuncionarias})`));
                }
            }

            // PRIORIDADE ABSOLUTA - OBRIGATÓRIA TODOS OS DIAS
            addTo1("Vistoria inicial geral");
            addTo2("Hall de entrada");
            addToAll("Lixeira – coleta, separação e higienização");
            addToAll("Área de lazer – Banheiros");

            // SE FOR SÁBADO, CORTAMOS AQUI + ELEVADOR APENAS PANO SECO
            if (i === 5) {
                const isPanoSeco = true; // Sábado é pano seco
                addTo1(isPanoSeco ? "Elevadores – limpeza interna e externa do hall (apenas pano seco)" : "Elevadores – limpeza interna e externa");
                // Removidas as revisões gerais a pedido do usuário
            } else {
                // DIAS NORMAIS (Seg a Sex)
                const isPanoSeco = (i === 1 || i === 3); // Ter e Qui são pano seco
                addTo1(isPanoSeco ? "Elevadores – limpeza interna e externa do hall (apenas pano seco)" : "Elevadores – limpeza interna e externa");

                // Distribuir lazer selecionado no form:
                if (lazerPorDia[i].length > 0) {
                    if (numFuncionarias === 1) {
                        lazerPorDia[i].forEach(l => addTo1(`Área de lazer - ${l}`));
                    } else {
                        lazerPorDia[i].forEach((l, idx) => {
                            funcionarias[idx % numFuncionarias].tarefas.push(`Área de lazer - ${l}`);
                        });
                    }
                }

                // Halls dos moradores (Seg, Qua, Sex)
                if (i === 0 || i === 2 || i === 4) { 
                    addDivided("Halls dos moradores");
                }

                // Tarefas detalhadas conforme carga horária
                if (cargaHoraria === '44h') {
                    if (i === 1) addToAll("Limpeza dos vidros – portas de acesso, janelas do térreo e hall");
                    if (i === 2) addToAll("Varrição das garagens + Passar pano úmido em 1 andar de garagem");
                    if (i === 3) {
                        addToAll("Trilhos dos elevadores – limpeza detalhada");
                        addToAll("Varrição das calçadas e entorno externo");
                    }
                } else {
                    // 22h (Menos carga pesada, já que o sábado também já é reduzido)
                    if (i === 1) addToAll("Limpeza dos vidros (Apenas áreas principais - Rotina 22h)");
                    if (i === 2) addToAll("Varrição das garagens + Passar pano (Apenas rotas de passagem - Rotina 22h)");
                    if (i === 3) addToAll("Trilhos dos elevadores (Limpeza superficial - Rotina 22h)");
                }
            }

            newSchedule.dias.push({
                nome: diaSemana,
                funcionarias
            });
        }

        setScheduleData(newSchedule);
    };

    const handleSave = async () => {
        if (!nomeCondominio.trim()) return alert('Preencha o nome do condomínio.');
        startTransition(async () => {
            const res = await saveCleaningSchedule({
                id: activeScheduleId,
                nomeCondominio,
                numFuncionarias,
                cargaHoraria,
                areas,
                scheduleData,
                observacoes
            });
            if (res.success) {
                setActiveScheduleId(res.data.id);
                await loadSchedules();
            } else {
                alert('Erro ao salvar: ' + res.error);
            }
        });
    };

    const handleLoad = (sched: any) => {
        setActiveScheduleId(sched.id);
        setNomeCondominio(sched.nomeCondominio);
        setNumFuncionarias(sched.numFuncionarias);
        setCargaHoraria(sched.cargaHoraria || '44h');
        setAreas(sched.areas || []);
        setScheduleData(sched.scheduleData);
        setObservacoes(sched.observacoes || '');
        setViewMode('generator');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este cronograma?")) return;
        startTransition(async () => {
            await deleteCleaningSchedule(id);
            if (activeScheduleId === id) {
                setActiveScheduleId(null);
                setScheduleData(null);
                setNomeCondominio('');
                setAreas([]);
            }
            await loadSchedules();
        });
    };

    const handleDuplicate = async (id: string) => {
        const novoNome = prompt("Qual o nome do novo condomínio?");
        if (!novoNome) return;
        startTransition(async () => {
            const res = await duplicateCleaningSchedule(id, novoNome);
            if (res.success) {
                handleLoad(res.data);
                await loadSchedules();
                setViewMode('generator');
            }
        });
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Cronograma_${nomeCondominio}`;
        window.print();
        setTimeout(() => { document.title = originalTitle; }, 100);
    };

    // --- Lógica Simples de Drag & Drop para o Editor ---
    const [draggedTask, setDraggedTask] = useState<{diaIdx: number, funcIdx: number, taskIdx: number, text: string} | null>(null);

    const onDragStart = (e: React.DragEvent, diaIdx: number, funcIdx: number, taskIdx: number, text: string) => {
        setDraggedTask({diaIdx, funcIdx, taskIdx, text});
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: React.DragEvent, targetDiaIdx: number, targetFuncIdx: number, targetTaskIdx: number) => {
        e.preventDefault();
        if (!draggedTask || !scheduleData) return;

        const newData = JSON.parse(JSON.stringify(scheduleData));
        newData.dias[draggedTask.diaIdx].funcionarias[draggedTask.funcIdx].tarefas.splice(draggedTask.taskIdx, 1);
        newData.dias[targetDiaIdx].funcionarias[targetFuncIdx].tarefas.splice(targetTaskIdx, 0, draggedTask.text);
        
        setScheduleData(newData);
        setDraggedTask(null);
    };

    const removeTask = (diaIdx: number, funcIdx: number, taskIdx: number) => {
        const newData = JSON.parse(JSON.stringify(scheduleData));
        newData.dias[diaIdx].funcionarias[funcIdx].tarefas.splice(taskIdx, 1);
        setScheduleData(newData);
    };

    const addTaskToFunc = (diaIdx: number, funcIdx: number) => {
        const task = prompt("Nome da nova tarefa:");
        if (!task) return;
        const newData = JSON.parse(JSON.stringify(scheduleData));
        newData.dias[diaIdx].funcionarias[funcIdx].tarefas.push(task);
        setScheduleData(newData);
    };

    if (viewMode === 'saved') {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('generator')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <LibraryBig className="w-8 h-8 text-indigo-400" />
                                Meus Cronogramas Salvos
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Gerencie os cronogramas que você já gerou e salvou.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schedules.map(s => (
                        <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">{s.nomeCondominio}</h3>
                                <div className="text-sm text-slate-400 space-y-1">
                                    <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {s.numFuncionarias} {s.numFuncionarias === 1 ? 'Funcionária' : 'Funcionárias'}</p>
                                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {s.cargaHoraria}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
                                <button onClick={() => handleLoad(s)} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">Abrir & Editar</button>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDuplicate(s.id)} className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 rounded-lg" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 rounded-lg" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {schedules.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            Nenhum cronograma salvo ainda.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CalendarDays className="w-8 h-8 text-indigo-400" />
                        Rotina Operacional de Limpeza
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere um cronograma altamente assertivo e ajustável.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <button
                        onClick={() => setViewMode('saved')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        <LibraryBig className="w-4 h-4" /> Meus Cronogramas Salvos
                    </button>
                    {activeScheduleId && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Printer className="w-4 h-4" /> Imprimir Documento
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isPending || !scheduleData}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Save className="w-4 h-4" /> {isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Layout em Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Coluna da Esquerda: Formulário */}
                <div className="xl:col-span-4 space-y-6 no-print">
                    
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-400" /> Dados Básicos
                            </h3>
                            {activeScheduleId && (
                                <button onClick={() => { setActiveScheduleId(null); setNomeCondominio(''); setAreas([]); setScheduleData(null); }} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
                                    + NOVO
                                </button>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1">Nome do Condomínio</label>
                            <input
                                value={nomeCondominio}
                                onChange={e => setNomeCondominio(e.target.value)}
                                placeholder="Ex: Residencial Flores"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Quantidade
                                </label>
                                <select
                                    value={numFuncionarias}
                                    onChange={e => setNumFuncionarias(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <option key={n} value={n}>{n} {n === 1 ? 'Func.' : 'Funcs.'}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" /> Carga Horária
                                </label>
                                <select
                                    value={cargaHoraria}
                                    onChange={e => setCargaHoraria(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="44h">44h Semanais</option>
                                    <option value="22h">22h Semanais</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-bold text-slate-400 ml-1 block">Quais áreas existem no condomínio?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LAZER_OPCOES.map(area => (
                                    <label key={area} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs font-bold ${areas.includes(area) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={areas.includes(area)} 
                                            onChange={() => toggleArea(area)} 
                                            className="w-3.5 h-3.5 rounded border-slate-600 text-indigo-500 focus:ring-0" 
                                        />
                                        <span className="truncate">{area}</span>
                                    </label>
                                ))}
                                {/* Custom areas added */}
                                {areas.filter(a => !LAZER_OPCOES.includes(a)).map(area => (
                                    <label key={area} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs font-bold bg-indigo-500/20 border-indigo-500/50 text-indigo-200">
                                        <input type="checkbox" checked={true} onChange={() => toggleArea(area)} className="w-3.5 h-3.5 rounded border-slate-600 text-indigo-500 focus:ring-0" />
                                        <span className="truncate">{area}</span>
                                    </label>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    value={novaArea}
                                    onChange={e => setNovaArea(e.target.value)}
                                    placeholder="Adicionar outra área..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    onKeyDown={e => e.key === 'Enter' && addCustomArea()}
                                />
                                <button onClick={addCustomArea} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-slate-400 ml-1 block">Observações (Aparecem no Rodapé)</label>
                            <textarea
                                value={observacoes}
                                onChange={e => setObservacoes(e.target.value)}
                                placeholder="Ex: Cuidado extra com o piso de madeira..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={generateSchedule}
                            disabled={!nomeCondominio}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Wand2 className="w-5 h-5" />
                            Gerar Cronograma
                        </button>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs text-indigo-300">
                        <p className="font-bold mb-1">Como funciona a geração:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-80">
                            <li>O cronograma segue o padrão rígido De Lucca (Vistoria Inicial primeiro).</li>
                            <li>A rotina de "pano seco" vs "limpeza geral" nos elevadores é alternada.</li>
                            <li>Halls, Garagens e Vidros possuem dias específicos na semana.</li>
                            <li>Se a carga horária for <strong>22h</strong>, as tarefas pesadas (garagem, vidros, trilhos) são amenizadas para dar tempo hábil.</li>
                        </ul>
                    </div>
                </div>

                {/* Coluna da Direita: Documento Final Editável (A4) */}
                <div className="xl:col-span-8 lg:sticky lg:top-8 h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar no-print-scroll pb-10 relative document-container">
                    {!scheduleData ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 min-h-[500px]">
                            <CalendarDays className="w-16 h-16 text-slate-600 mb-4 opacity-50" />
                            <p className="font-medium text-lg">Nenhum cronograma gerado</p>
                            <p className="text-sm max-w-sm text-center mt-2">Preencha os dados do condomínio e clique em "Gerar Cronograma" para visualizar o documento.</p>
                        </div>
                    ) : (
                        <div className="bg-white text-black mx-auto shadow-2xl printable-area">
                            <table className="w-full border-collapse">
                                <thead><tr><td style={{ height: '1cm' }}></td></tr></thead>
                                <tfoot><tr><td style={{ height: '1cm' }}></td></tr></tfoot>
                                <tbody>
                                    <tr>
                                        <td style={{ paddingLeft: '1.5cm', paddingRight: '1.5cm', paddingBottom: '0' }}>
                                            
                                            {/* Cabeçalho do Documento */}
                                            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Cronograma de Rotina</h2>
                                                    <h3 className="text-xl font-bold text-slate-600 mt-1 uppercase">{nomeCondominio}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline gap-0 justify-end">
                                                        <span className="text-4xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                                        <span className="text-4xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                                                    </div>
                                                    <div className="text-lg text-[#00CEE4] -mt-2 italic font-serif">Gestão em Limpeza</div>
                                                </div>
                                            </div>

                                            {/* Regra de Ouro */}
                                            <div className="bg-slate-100 border-l-4 border-slate-800 p-4 mb-6">
                                                <h4 className="font-black text-slate-800 uppercase flex items-center gap-2 mb-2">
                                                    <CheckCircle2 className="w-5 h-5" /> Regra de Ouro da Limpeza
                                                </h4>
                                                <p className="text-sm font-medium text-slate-700 text-justify">
                                                    <strong>1º PASSO:</strong> Inspeção visual completa no condomínio. Verificar se luzes, TVs e Ar-Condicionados foram deixados ligados, se há vazamentos, portas abertas ou anormalidades. Reportar à sindicatura ou base imediatamente se houver urgências.
                                                    <br/><br/>
                                                    <strong>2º PASSO:</strong> Somente após a inspeção, iniciar as limpezas começando sempre pelo Hall de Entrada, seguido da Lixeira e dos Banheiros da Área de Lazer.
                                                </p>
                                            </div>

                                            {/* Dias da Semana (Grid ou Lista) */}
                                            <div className="space-y-6">
                                                {scheduleData.dias.map((dia: any, diaIdx: number) => (
                                                    <div key={diaIdx} className="avoid-break border border-slate-300 rounded-lg overflow-hidden">
                                                        <div className="bg-slate-800 text-white px-4 py-2 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                                            <CalendarDays className="w-4 h-4" /> {dia.nome}
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                                                            {dia.funcionarias.map((func: any, funcIdx: number) => (
                                                                <div key={funcIdx} className={`p-4 bg-white ${numFuncionarias === 1 ? 'md:col-span-2' : ''}`}>
                                                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                                        <h5 className="font-bold text-slate-700 text-xs uppercase flex items-center gap-2">
                                                                            <Users className="w-4 h-4 text-slate-400" /> {func.nome}
                                                                        </h5>
                                                                        <button onClick={() => addTaskToFunc(diaIdx, funcIdx)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded no-print transition-colors" title="Adicionar Tarefa">
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    <ul className="space-y-2 text-justify">
                                                                        {func.tarefas.map((tarefa: string, taskIdx: number) => (
                                                                            <li 
                                                                                key={taskIdx}
                                                                                draggable
                                                                                onDragStart={(e) => onDragStart(e, diaIdx, funcIdx, taskIdx, tarefa)}
                                                                                onDragOver={onDragOver}
                                                                                onDrop={(e) => onDrop(e, diaIdx, funcIdx, taskIdx)}
                                                                                className="group flex items-start gap-2 text-sm text-slate-700 p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all cursor-move relative leading-tight"
                                                                            >
                                                                                <div className="mt-0.5 text-slate-300 group-hover:text-slate-500 no-print flex-shrink-0">
                                                                                    <GripVertical className="w-4 h-4" />
                                                                                </div>
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0 print:block hidden"></div>
                                                                                <span className="flex-1 font-medium text-justify">{tarefa}</span>
                                                                                <button 
                                                                                    onClick={() => removeTask(diaIdx, funcIdx, taskIdx)}
                                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-100 rounded transition-all no-print flex-shrink-0"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                        {/* Drop zone no final da lista */}
                                                                        <li 
                                                                            onDragOver={onDragOver}
                                                                            onDrop={(e) => onDrop(e, diaIdx, funcIdx, func.tarefas.length)}
                                                                            className="h-6 border-2 border-dashed border-transparent hover:border-indigo-300 rounded bg-transparent transition-colors no-print"
                                                                        ></li>
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Observações */}
                                            {observacoes && (
                                                <div className="mt-6 pt-4 border-t-2 border-slate-800 avoid-break">
                                                    <h4 className="font-black text-slate-800 uppercase mb-2 text-sm">Observações Importantes:</h4>
                                                    <p className="text-sm font-medium text-slate-700 text-justify whitespace-pre-wrap">{observacoes}</p>
                                                </div>
                                            )}

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .printable-area {
                    width: 100%;
                    max-width: 21cm;
                    min-height: 29.7cm;
                    padding: 0;
                    margin: 0 auto;
                    background: white;
                    font-family: "Inter", "Arial", sans-serif;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
                    
                    /* Esconder TUDO fora da area de impressao */
                    body * { visibility: hidden; }
                    .no-print { display: none !important; }
                    
                    /* Resetar grids e flexboxes do pai */
                    body, html, main, #__next, .max-w-7xl, .grid, .xl\\:col-span-8, .document-container { 
                        display: block !important;
                        height: auto !important; 
                        width: 100% !important;
                        position: static !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        grid-template-columns: none !important;
                    }
                    
                    .printable-area, .printable-area * { visibility: visible; }
                    
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
                    
                    /* Justificar os textos da regra de ouro e observacoes */
                    p.text-justify { text-align: justify !important; }
                    span.text-justify { text-align: justify !important; display: block; }
                }
            ` }} />
        </div>
    );
}
