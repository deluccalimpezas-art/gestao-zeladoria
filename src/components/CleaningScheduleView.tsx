'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react';
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
    Users
} from 'lucide-react';
import { saveCleaningSchedule, deleteCleaningSchedule, getCleaningSchedules, duplicateCleaningSchedule } from '../../app/actions';

// Constantes
const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DIAS_ALTERNADOS_1 = ['Segunda-feira', 'Quarta-feira', 'Sexta-feira'];
const DIAS_ALTERNADOS_2 = ['Terça-feira', 'Quinta-feira', 'Sábado'];

const TAREFAS_FIXAS_DIARIAS = [
    "Lixeira",
    "Hall de Entrada",
    "Hall da Área de Lazer"
];

const TAREFAS_FIXAS_ALTERNADAS = [
    "Hall dos Apartamentos",
    "Elevadores",
    "Frente do condomínio"
];

const INSPECAO_GERAL = "Inspeção Geral do Condomínio (TVs, AC, luzes, portas, vazamentos, anormalidades)";

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
    const [schedules, setSchedules] = useState<any[]>([]);
    const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

    // Form State
    const [nomeCondominio, setNomeCondominio] = useState('');
    const [numFuncionarias, setNumFuncionarias] = useState(1);
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
        // Motor de Geração
        const newSchedule: any = { dias: [] };

        // Distribuir áreas de lazer pelos 6 dias
        // Se temos N áreas de lazer, tentamos dividir igualmente
        const areasLazer = [...areas];
        const lazerPorDia = Array.from({ length: 6 }, () => [] as string[]);
        
        let diaIdx = 0;
        areasLazer.forEach(area => {
            lazerPorDia[diaIdx].push(area);
            diaIdx = (diaIdx + 1) % 6; // round robin
        });

        // Montar a rotina para cada dia
        for (let i = 0; i < 6; i++) {
            const diaSemana = DIAS_SEMANA[i];
            const isDiaAlternado1 = DIAS_ALTERNADOS_1.includes(diaSemana);
            
            // Tarefas do dia inteiro
            const tarefasDoDia = [
                INSPECAO_GERAL,
                ...TAREFAS_FIXAS_DIARIAS,
                ...(isDiaAlternado1 ? TAREFAS_FIXAS_ALTERNADAS : []), // Altera entre os dias
                ...lazerPorDia[i] // Áreas de lazer do dia
            ];

            // Dividir pelas funcionárias
            const funcionarias = Array.from({ length: numFuncionarias }, (_, idx) => ({
                id: idx + 1,
                nome: numFuncionarias === 1 ? 'Funcionária 1 (Rotina Completa)' : `Funcionária ${idx + 1}`,
                tarefas: [] as string[]
            }));

            if (numFuncionarias === 1) {
                funcionarias[0].tarefas = tarefasDoDia;
            } else {
                // Divisão simples: Inspeção Geral sempre com a Func 1 (ou dividida). 
                // Para simplificar, dividimos as tarefas sequencialmente (round robin), 
                // mantendo a ordem obrigatória intacta na visão geral.
                // Mas, operacionalmente, a Inspeção Geral e as fixas diárias podem ficar com a 1, e lazer/alternadas com a 2.
                
                // Inspeção Geral - Func 1
                funcionarias[0].tarefas.push(INSPECAO_GERAL);
                
                // Lixeira, Hall de Entrada, Hall Área Lazer -> Func 1
                TAREFAS_FIXAS_DIARIAS.forEach(t => funcionarias[0].tarefas.push(t));

                // Hall Apto, Elevador, Frente -> Func 2 (se houver, senão Func 1)
                const funcParaAlternadas = numFuncionarias > 1 ? 1 : 0;
                if (isDiaAlternado1) {
                    TAREFAS_FIXAS_ALTERNADAS.forEach(t => funcionarias[funcParaAlternadas].tarefas.push(t));
                }

                // Áreas de lazer: distribui pelas funcionárias a partir da 2 (ou 1 se só tiver 1)
                let funcLazerIdx = numFuncionarias > 1 ? 1 : 0;
                lazerPorDia[i].forEach(area => {
                    funcionarias[funcLazerIdx].tarefas.push(area);
                    funcLazerIdx = (funcLazerIdx + 1) % numFuncionarias;
                    // Evita colocar lazer na func 1 se tivermos + de 1 func (para balancear com as fixas)
                    if (funcLazerIdx === 0 && numFuncionarias > 1) funcLazerIdx = 1;
                });
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
        setAreas(sched.areas || []);
        setScheduleData(sched.scheduleData);
        setObservacoes(sched.observacoes || '');
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
        
        // Remover a original
        newData.dias[draggedTask.diaIdx].funcionarias[draggedTask.funcIdx].tarefas.splice(draggedTask.taskIdx, 1);
        
        // Inserir na nova posição
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
                    {activeScheduleId && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                        >
                            <Printer className="w-4 h-4" /> Imprimir Documento
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isPending || !scheduleData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <Save className="w-4 h-4" /> {isPending ? 'Salvando...' : 'Salvar Cronograma'}
                    </button>
                </div>
            </div>

            {/* Layout em Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Coluna da Esquerda: Formulário e Lista de Salvos */}
                <div className="xl:col-span-4 space-y-6 no-print">
                    
                    {/* Lista de Cronogramas Salvos */}
                    {schedules.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-700 pb-2">
                                <Save className="w-4 h-4 text-emerald-400" /> Carregar Salvos
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {schedules.map(s => (
                                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${activeScheduleId === s.id ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                                        <button onClick={() => handleLoad(s)} className="flex-1 text-left font-bold text-sm text-slate-200 truncate pr-2">
                                            {s.nomeCondominio}
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleDuplicate(s.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-lg" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {activeScheduleId && (
                                <button onClick={() => { setActiveScheduleId(null); setNomeCondominio(''); setAreas([]); setScheduleData(null); }} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                    + Criar Novo Cronograma
                                </button>
                            )}
                        </div>
                    )}

                    {/* Formulário de Configuração */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-lg">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-400" /> Dados Básicos
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1">Nome do Condomínio</label>
                            <input
                                value={nomeCondominio}
                                onChange={e => setNomeCondominio(e.target.value)}
                                placeholder="Ex: Residencial Flores"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Quantidade de Funcionárias
                            </label>
                            <select
                                value={numFuncionarias}
                                onChange={e => setNumFuncionarias(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            >
                                {[1, 2, 3, 4, 5].map(n => (
                                    <option key={n} value={n}>{n} {n === 1 ? 'Funcionária' : 'Funcionárias'}</option>
                                ))}
                            </select>
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
                                placeholder="Ex: Cuidado extra com o piso de madeira no salão de festas..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={generateSchedule}
                            disabled={!nomeCondominio}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Wand2 className="w-5 h-5" />
                            Gerar Cronograma
                        </button>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs text-indigo-300">
                        <p className="font-bold mb-1">Como funciona a geração:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-80">
                            <li>A "Inspeção Geral" é sempre a primeira tarefa.</li>
                            <li>Lixeira e Halls são limpos diariamente.</li>
                            <li>Corredores de aptos e elevadores são dia sim, dia não.</li>
                            <li>A área de lazer selecionada é dividida entre os dias da semana automaticamente.</li>
                            <li>Se houver mais de uma funcionária, as tarefas são distribuídas entre elas.</li>
                        </ul>
                    </div>
                </div>

                {/* Coluna da Direita: Documento Final Editável (A4) */}
                <div className="xl:col-span-8 lg:sticky lg:top-8 h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar no-print-scroll pb-10 relative">
                    {!scheduleData ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 min-h-[500px]">
                            <CalendarDays className="w-16 h-16 text-slate-600 mb-4 opacity-50" />
                            <p className="font-medium text-lg">Nenhum cronograma gerado</p>
                            <p className="text-sm max-w-sm text-center mt-2">Preencha os dados do condomínio e clique em "Gerar Cronograma" para visualizar o documento.</p>
                        </div>
                    ) : (
                        <div className="bg-white text-black mx-auto shadow-2xl printable-area">
                            <table className="w-full border-collapse">
                                <thead><tr><td style={{ height: '2cm' }}></td></tr></thead>
                                <tfoot><tr><td style={{ height: '2cm' }}></td></tr></tfoot>
                                <tbody>
                                    <tr>
                                        <td style={{ paddingLeft: '2cm', paddingRight: '2cm', paddingBottom: '0' }}>
                                            
                                            {/* Cabeçalho do Documento */}
                                            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex items-center justify-between">
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
                                            <div className="bg-slate-100 border-l-4 border-slate-800 p-4 mb-8">
                                                <h4 className="font-black text-slate-800 uppercase flex items-center gap-2 mb-2">
                                                    <CheckCircle2 className="w-5 h-5" /> Regra de Ouro da Limpeza
                                                </h4>
                                                <p className="text-sm font-medium text-slate-700">
                                                    <strong>1º PASSO:</strong> Inspeção visual completa no condomínio. Verificar se luzes, TVs e Ar-Condicionados foram deixados ligados, se há vazamentos, portas abertas ou anormalidades. Reportar à sindicatura ou base imediatamente se houver urgências.
                                                    <br/><br/>
                                                    <strong>2º PASSO:</strong> Somente após a inspeção, iniciar as limpezas começando pela Lixeira, seguindo para o Hall de Entrada e Hall da Área de Lazer.
                                                </p>
                                            </div>

                                            {/* Dias da Semana (Grid ou Lista) */}
                                            <div className="space-y-8">
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
                                                                    
                                                                    <ul className="space-y-2">
                                                                        {func.tarefas.map((tarefa: string, taskIdx: number) => (
                                                                            <li 
                                                                                key={taskIdx}
                                                                                draggable
                                                                                onDragStart={(e) => onDragStart(e, diaIdx, funcIdx, taskIdx, tarefa)}
                                                                                onDragOver={onDragOver}
                                                                                onDrop={(e) => onDrop(e, diaIdx, funcIdx, taskIdx)}
                                                                                className="group flex items-start gap-2 text-sm text-slate-700 p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all cursor-move relative"
                                                                            >
                                                                                <div className="mt-0.5 text-slate-300 group-hover:text-slate-500 no-print flex-shrink-0">
                                                                                    <GripVertical className="w-4 h-4" />
                                                                                </div>
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0 print:block hidden"></div>
                                                                                <span className="flex-1 font-medium">{tarefa}</span>
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
                                                                            className="h-8 border-2 border-dashed border-transparent hover:border-indigo-300 rounded bg-transparent transition-colors no-print"
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
                                                <div className="mt-8 pt-6 border-t-2 border-slate-800 avoid-break">
                                                    <h4 className="font-black text-slate-800 uppercase mb-2">Observações Importantes:</h4>
                                                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{observacoes}</p>
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
                    .no-print-scroll { height: auto !important; overflow: visible !important; }
                    @page { margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    .no-print { display: none !important; }
                    body, html, main, div { height: auto !important; overflow: visible !important; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        box-shadow: none !important;
                    }
                    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
                }
            ` }} />
        </div>
    );
}
