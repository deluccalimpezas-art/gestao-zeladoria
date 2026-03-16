import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Building2, Users, Wallet, Activity, AlertTriangle, TrendingDown, Save, Check, Plus, FileText, UploadCloud, Loader2, FileCheck, Eye, Undo2, Redo2, Trash2 } from 'lucide-react';
import type { MonthlyFinanceData, CondominioData, FuncionarioData, ImpostoData, NotaFiscalData } from '../modelsFinance';
import { Modal } from './Modal';
import { extractTextFromPdf, parseNfText } from '../lib/pdfParser';

interface MonthDetailViewProps {
    month: MonthlyFinanceData;
    onBack: () => void;
    onSave: (updated: MonthlyFinanceData) => void;
}

type TabType = 'visao_geral' | 'condominios' | 'folha' | 'impostos';

export function MonthDetailView({ month, onBack, onSave }: MonthDetailViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('visao_geral');
    const [localMonth, setLocalMonth] = useState<MonthlyFinanceData>(month);
    const [history, setHistory] = useState<MonthlyFinanceData[]>([month]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    // Ignora a primeira renderização para não disparar save à toa
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!hasChanges) return;

        setSaveStatus('saving');
        const timer = setTimeout(() => {
            // Calcula lucro atualizado do estado local mais recente (evita hooks obsoletos)
            let currBruto = 0, currInss = 0, currSalarios = 0, currImpostos = 0;
            
            const validCondos = (localMonth.condominios || []).filter(c => c.nome?.toUpperCase() !== 'TOTAL' && c.nome?.toUpperCase() !== 'TOTAL GERAL');
            const validFuncs = (localMonth.funcionarios || []).filter(f => f.nome?.toUpperCase() !== 'TOTAL');
            const validImpostos = (localMonth.impostos || []).filter(i => i.nome?.toUpperCase() !== 'TOTAL' && !i.nome?.toUpperCase().includes('TOTAL IMPOSTOS'));

            currBruto = (validCondos.length === 0 || (validCondos.length === 1 && !validCondos[0].nome)) && (localMonth.receitaBruta || 0) > 0 ? (localMonth.receitaBruta || 0) : validCondos.reduce((acc, c) => acc + (Number(c.receitaBruta) || 0), 0);
            currInss = (validCondos.length === 0 || (validCondos.length === 1 && !validCondos[0].nome)) && (localMonth.inssRetido || 0) > 0 ? (localMonth.inssRetido || 0) : validCondos.reduce((acc, c) => acc + (Number(c.inssRetido) || 0), 0);
            currSalarios = validFuncs.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);
            currImpostos = validImpostos.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

            const lucroEstimado = (currBruto - currInss) - (currSalarios + currImpostos);

            onSaveRef.current({
                ...localMonth,
                lucroEstimado
            });

            setHasChanges(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1500);

        return () => clearTimeout(timer);
    }, [localMonth, hasChanges]);

    const updateHistory = (newState: MonthlyFinanceData) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setLocalMonth(newState);
        setHasChanges(true);
    };

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setLocalMonth(history[historyIndex - 1]);
            setHasChanges(true);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setLocalMonth(history[historyIndex + 1]);
            setHasChanges(true);
        }
    }, [history, historyIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    // Modal de Nota Fiscal
    const [selectedNfCondo, setSelectedNfCondo] = useState<number | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [tempNfData, setTempNfData] = useState<NotaFiscalData>({
        valor: 0,
        dataEmissao: '',
        descricao: ''
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value).replace(/\s/g, '');
    };

    // Função handleSave antiga removida pois agora usamos o useEffect para autosave

    const updateCondo = (index: number, field: keyof CondominioData, value: string | number | boolean) => {
        const list = [...(localMonth.condominios || [])];
        const item = { ...list[index], [field]: value };

        if (field === 'receitaBruta') {
            item.inssRetido = (Number(item.receitaBruta) || 0) * 0.11;
        }

        if (field === 'receitaBruta' || field === 'inssRetido') {
            item.receitaLiquida = (Number(item.receitaBruta) || 0) - (Number(item.inssRetido) || 0);
        }

        list[index] = item;

        // Filter out TOTAL rows before calculating totals to avoid double counting
        const validCondos = list.filter(c =>
            c.nome?.toUpperCase() !== 'TOTAL' &&
            c.nome?.toUpperCase() !== 'TOTAL GERAL'
        );

        const totalBruto = validCondos.reduce((acc, c) => acc + (Number(c.receitaBruta) || 0), 0);
        const totalInss = validCondos.reduce((acc, c) => acc + (Number(c.inssRetido) || 0), 0);
        const totalLiquida = totalBruto - totalInss;

        updateHistory({
            ...localMonth,
            condominios: list,
            receitaBruta: totalBruto,
            inssRetido: totalInss,
            receitaLiquida: totalLiquida
        });
        setHasChanges(true);
    };

    const openNfModal = (condoIndex: number) => {
        const condo = localMonth.condominios?.[condoIndex];
        if (!condo) return;

        setSelectedNfCondo(condoIndex);
        setTempNfData(condo.notaFiscal || {
            valor: condo.receitaBruta || 0, // Suggest the gross value by default
            dataEmissao: new Date().toISOString().split('T')[0],
            descricao: `Serviços de portaria/limpeza - ${localMonth.monthName}`
        });
    };

    const saveNfData = () => {
        if (selectedNfCondo === null) return;

        const list = [...(localMonth.condominios || [])];
        const condo = { ...list[selectedNfCondo] };

        condo.notaFiscal = { ...tempNfData };
        // Auto-check "NF Feita" if a value or date is provided
        if (tempNfData.valor > 0 || tempNfData.dataEmissao) {
            condo.nfFeita = true;
        }

        list[selectedNfCondo] = condo;

        updateHistory({
            ...localMonth,
            condominios: list
        });
        setHasChanges(true);
        setSelectedNfCondo(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            // Ler texto do PDF
            const extractedText = await extractTextFromPdf(file);
            const parsedData = parseNfText(extractedText);

            // Converter o arquivo PDF em Base64 para armazenarmos no banco/state
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);

            fileReader.onload = () => {
                const base64String = fileReader.result as string;

                // Update fields
                setTempNfData(prev => ({
                    ...prev,
                    valor: parsedData.valor !== null ? parsedData.valor : prev.valor,
                    dataEmissao: parsedData.dataEmissao !== null ? parsedData.dataEmissao : prev.dataEmissao,
                    descricao: parsedData.descricao !== null ? parsedData.descricao : prev.descricao,
                    arquivoBase64: base64String,
                    nomeArquivo: file.name
                }));
                setIsParsing(false);
            };

            fileReader.onerror = () => {
                console.error("Erro ao converter arquivo para Base64.");
                alert("Houve um erro ao processar o arquivo.");
                setIsParsing(false);
            };

        } catch (error) {
            console.error("Erro ao ler PDF:", error);
            alert("Não foi possível ler este PDF. O arquivo pode estar corrompido ou protegido.");
            setIsParsing(false);
        } finally {
            // Reset input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    const updateFunc = (index: number, field: keyof FuncionarioData, value: string | number) => {
        const list = [...(localMonth.funcionarios || [])];
        const updated = { ...list[index], [field]: value };

        // Auto-calculate: Total = Salário + Horas Extras - Vales - (Faltas × Salário/30)
        if (field === 'salario' || field === 'horasExtras' || field === 'vales' || field === 'faltas') {
            const sal = Number(field === 'salario' ? value : updated.salario) || 0;
            const extras = Number(field === 'horasExtras' ? value : updated.horasExtras) || 0;
            const vales = Number(field === 'vales' ? value : updated.vales) || 0;
            const faltas = Number(field === 'faltas' ? value : updated.faltas) || 0;
            const descontoFaltas = (sal / 30) * faltas;
            updated.totalReceber = Math.max(0, sal + extras - vales - descontoFaltas);
        }

        list[index] = updated;
        const totalSalarios = list.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);

        updateHistory({ ...localMonth, funcionarios: list, totalSalarios });
        setHasChanges(true);
    };

    const updateImposto = (index: number, field: keyof ImpostoData, value: string | number) => {
        const list = [...(localMonth.impostos || [])];
        list[index] = { ...list[index], [field]: value };

        const totalImpostos = list.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

        updateHistory({ ...localMonth, impostos: list, totalImpostos });
        setHasChanges(true);
    };

    const addCondo = () => {
        const newList = [...(localMonth.condominios || []), {
            id: crypto.randomUUID(),
            nome: 'Novo Condomínio',
            cnpj: '',
            receitaBruta: 0,
            inssRetido: 0,
            receitaLiquida: 0,
            nfFeita: false,
            nfEnviada: false,
            pagamentoFeito: false
        }];
        updateHistory({ ...localMonth, condominios: newList });
        setHasChanges(true);
    };

    const removeCondo = (index: number) => {
        const newList = (localMonth.condominios || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, condominios: newList });
        setHasChanges(true);
    };

    const addFuncionario = () => {
        const newList = [...(localMonth.funcionarios || []), {
            id: crypto.randomUUID(),
            nome: 'Novo Funcionário',
            condominio: '',
            salario: 0,
            horasExtras: 0,
            vales: 0,
            totalReceber: 0
        }];
        updateHistory({ ...localMonth, funcionarios: newList });
        setHasChanges(true);
    };

    const removeFuncionario = (index: number) => {
        const newList = (localMonth.funcionarios || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, funcionarios: newList });
        setHasChanges(true);
    };

    const addImposto = () => {
        const newList = [...(localMonth.impostos || []), {
            id: crypto.randomUUID(),
            nome: 'Novo Imposto',
            vencimento: '',
            valor: 0
        }];
        updateHistory({ ...localMonth, impostos: newList });
        setHasChanges(true);
    };

    const removeImposto = (index: number) => {
        const newList = (localMonth.impostos || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, impostos: newList });
        setHasChanges(true);
    };

    const rhMetrics = useMemo(() => {
        let totalFaltas = 0;
        const faltantes: { nome: string; faltas: number }[] = [];

        localMonth.funcionarios?.forEach(func => {
            if (func.faltas && Number(func.faltas) > 0) {
                totalFaltas += Number(func.faltas);
                faltantes.push({ nome: func.nome, faltas: Number(func.faltas) });
            }
        });

        faltantes.sort((a, b) => b.faltas - a.faltas);
        return { totalFaltas, topFaltantes: faltantes.slice(0, 3) };
    }, [localMonth.funcionarios]);


    const sortedCondos = useMemo(() => {
        return (localMonth.condominios || [])
            .map((c, originalIndex) => ({ ...c, originalIndex }))
            .filter(c => c.nome?.toUpperCase() !== 'TOTAL' && c.nome?.toUpperCase() !== 'TOTAL GERAL')
            .sort((a, b) => (Number(b.receitaBruta) || 0) - (Number(a.receitaBruta) || 0));
    }, [localMonth.condominios]);

    const sortedFuncs = useMemo(() => {
        return (localMonth.funcionarios || [])
            .map((f, originalIndex) => ({ ...f, originalIndex }))
            .filter(f => f.nome?.toUpperCase() !== 'TOTAL')
            .sort((a, b) => (Number(b.totalReceber) || 0) - (Number(a.totalReceber) || 0));
    }, [localMonth.funcionarios]);

    const sortedImpostos = useMemo(() => {
        const parseDate = (dStr?: string) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            if (parts.length < 2) return 0;
            const day = parseInt(parts[0]) || 0;
            const month = parseInt(parts[1]) || 0;
            const year = parts.length === 3 ? parseInt(parts[2]) : 2026;
            return new Date(year, month - 1, day).getTime();
        };

        return [...(localMonth.impostos || [])].sort((a, b) => parseDate(a.vencimento) - parseDate(b.vencimento));
    }, [localMonth.impostos]);

    const allNfFeita = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.nfFeita), [sortedCondos]);
    const allNfEnviada = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.nfEnviada), [sortedCondos]);
    const allPagamento = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.pagamentoFeito), [sortedCondos]);

    const currentTotals = useMemo(() => {
        const validCondos = (localMonth.condominios || []).filter(c =>
            c.nome?.toUpperCase() !== 'TOTAL' &&
            c.nome?.toUpperCase() !== 'TOTAL GERAL'
        );

        const validFuncs = (localMonth.funcionarios || []).filter(f =>
            f.nome?.toUpperCase() !== 'TOTAL'
        );

        const validImpostos = (localMonth.impostos || []).filter(i =>
            i.nome?.toUpperCase() !== 'TOTAL' &&
            !i.nome?.toUpperCase().includes('TOTAL IMPOSTOS')
        );

        const bruto = (validCondos.length === 0 || (validCondos.length === 1 && !validCondos[0].nome)) && (localMonth.receitaBruta || 0) > 0
            ? (localMonth.receitaBruta || 0)
            : validCondos.reduce((acc, c) => acc + (Number(c.receitaBruta) || 0), 0);

        const inss = (validCondos.length === 0 || (validCondos.length === 1 && !validCondos[0].nome)) && (localMonth.inssRetido || 0) > 0
            ? (localMonth.inssRetido || 0)
            : validCondos.reduce((acc, c) => acc + (Number(c.inssRetido) || 0), 0);

        const liquida = bruto - inss;

        const salarios = validFuncs.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);
        const impostos = validImpostos.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

        return { bruto, liquida, inss, salarios, impostos };
    }, [localMonth]);

    const lucroCalculado = currentTotals.liquida - (currentTotals.salarios + currentTotals.impostos);

    const openPdfPreview = () => {
        if (!tempNfData.arquivoBase64) return;

        try {
            // Convert base64 to Blob
            const base64Parts = tempNfData.arquivoBase64.split(',');
            const contentType = base64Parts[0].split(':')[1].split(';')[0];
            const raw = window.atob(base64Parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);

            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            const blob = new Blob([uInt8Array], { type: contentType });
            const url = URL.createObjectURL(blob);

            // Open in new window
            window.open(url, '_blank');
        } catch (error) {
            console.error("Erro ao abrir preview:", error);
            alert("Não foi possível abrir o preview deste arquivo.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 group/title">
                            <input
                                value={localMonth.monthName}
                                onChange={(e) => {
                                    updateHistory({ ...localMonth, monthName: e.target.value });
                                    setHasChanges(true);
                                }}
                                className="text-2xl font-bold text-white tracking-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1 w-auto min-w-[100px]"
                                title="Clique para renomear"
                            />
                        </div>
                        <p className="text-slate-400">Dados da planilha {localMonth.monthName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 border-r border-slate-700 pr-3 mr-1">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex === 0}
                            className={`p-2 rounded-lg transition-colors border border-slate-700 ${historyIndex > 0 ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-lg' : 'bg-slate-800/30 text-slate-600 border-transparent cursor-not-allowed'}`}
                            title="Desfazer (Ctrl+Z)"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex === history.length - 1}
                            className={`p-2 rounded-lg transition-colors border border-slate-700 ${historyIndex < history.length - 1 ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-lg' : 'bg-slate-800/30 text-slate-600 border-transparent cursor-not-allowed'}`}
                            title="Refazer (Ctrl+Y)"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>

                    {hasChanges && (
                        <span className="text-xs text-amber-500 font-medium animate-pulse">Alterações pendentes</span>
                    )}
                    <div className="flex items-center">
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-2 text-indigo-400 text-sm font-medium px-4 py-2 bg-indigo-500/10 rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium px-4 py-2 bg-emerald-500/10 rounded-xl">
                                <Check className="w-4 h-4" /> Salvo!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="flex overflow-x-auto border-b border-slate-700 bg-slate-900/20 px-4 pt-4 hide-scrollbar">
                    <TabButton active={activeTab === 'visao_geral'} onClick={() => setActiveTab('visao_geral')} icon={<Activity className="w-4 h-4" />} label="Visão Geral" />
                    <TabButton active={activeTab === 'condominios'} onClick={() => setActiveTab('condominios')} icon={<Building2 className="w-4 h-4" />} label="Condomínios" />
                    <TabButton active={activeTab === 'folha'} onClick={() => setActiveTab('folha')} icon={<Users className="w-4 h-4" />} label="Folha de Pagamento" />
                    <TabButton active={activeTab === 'impostos'} onClick={() => setActiveTab('impostos')} icon={<Wallet className="w-4 h-4" />} label="Impostos" />
                </div>

                <div className="flex-1 bg-slate-800 min-h-[500px]">
                    {activeTab === 'visao_geral' && (
                        <div className="p-6 space-y-8 animate-in fade-in duration-300">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-emerald-400" /> Resumo Estratégico
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <SummaryCard label="Receita Bruta" value={formatCurrency(currentTotals.bruto)} />
                                    <SummaryCard label="Receita Líquida" value={formatCurrency(currentTotals.liquida)} color="text-emerald-400" />
                                    <SummaryCard label="Despesas Operacionais" value={formatCurrency(currentTotals.salarios + currentTotals.impostos)} color="text-red-400" />
                                    <SummaryCard label="Resultado (Lucro)" value={formatCurrency(lucroCalculado)} color="text-indigo-400" special />
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-purple-400" /> Operação
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-4 bg-slate-800 rounded-lg">
                                            <h4 className="text-4xl font-black text-white mb-2">{localMonth.condominios?.length || 0}</h4>
                                            <span className="text-xs uppercase font-medium text-slate-400">Condomínios</span>
                                        </div>
                                        <div className="p-4 bg-slate-800 rounded-lg">
                                            <h4 className="text-4xl font-black text-white mb-2">{localMonth.funcionarios?.length || 0}</h4>
                                            <span className="text-xs uppercase font-medium text-slate-400">Funcionários</span>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-slate-900/50 border border-amber-900/30 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Absenteísmo
                                    </h3>
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-center min-w-[120px]">
                                            <h4 className="text-3xl font-black text-amber-500 mb-1 flex items-center justify-center gap-1">
                                                <TrendingDown className="w-5 h-5" /> {rhMetrics.totalFaltas}
                                            </h4>
                                            <span className="text-xs font-medium text-slate-400">FALTAS</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Total de <strong>{rhMetrics.totalFaltas} dias</strong>. Atualize as faltas na aba de Folha para corrigir este índice.
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'condominios' && (
                        <div className="flex flex-col">
                            <div className="p-4 border-b border-slate-700 bg-slate-900/10 flex justify-end">
                                <button
                                    onClick={addCondo}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-purple-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Condomínio
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300 border-collapse">
                                    <thead className="bg-slate-900/50 text-[10px] uppercase font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="px-2 py-3 w-auto text-slate-400 min-w-[180px]">Condomínio / CNPJ</th>
                                            <th className="px-1 py-3 text-center w-8 text-slate-400" title="Ver Detalhes da Nota Fiscal">NF</th>
                                            <th className={`px-1 py-3 text-center w-10 transition-colors ${allNfFeita ? 'text-amber-300' : 'text-slate-400'}`} title="NF Feita">Feita</th>
                                            <th className={`px-1 py-3 text-center w-10 transition-colors ${allNfEnviada ? 'text-amber-300' : 'text-slate-400'}`} title="NF Enviada">Env.</th>
                                            <th className={`px-1 py-3 text-center w-10 transition-colors ${allPagamento ? 'text-emerald-300' : 'text-slate-400'}`} title="Pagamento Realizado">Pagt.</th>
                                            <th className="px-2 py-3 text-right text-slate-400 w-28">Bruto</th>
                                            <th className="px-2 py-3 text-right text-slate-400 w-28">INSS</th>
                                            <th className="px-2 py-3 text-right font-bold text-slate-400 w-28">Líquido</th>
                                            <th className="px-2 py-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sortedCondos?.map((condo) => (
                                            <tr key={condo.originalIndex} className="hover:bg-slate-700/10 group h-14">
                                                <td className="px-2 py-2">
                                                    <div className="flex flex-col gap-0.5 w-full max-w-[250px]">
                                                        <input
                                                            value={condo.nome}
                                                            onChange={(e) => updateCondo(condo.originalIndex, 'nome', e.target.value)}
                                                            className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-white font-bold text-xs truncate"
                                                            placeholder="Nome"
                                                            title={condo.nome}
                                                        />
                                                        <div className="flex items-center gap-1 px-1">
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter shrink-0">CNPJ:</span>
                                                            <input
                                                                value={condo.cnpj || ''}
                                                                onChange={(e) => updateCondo(condo.originalIndex, 'cnpj', e.target.value)}
                                                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-slate-500 font-mono text-[10px]"
                                                                placeholder="00.000.../0000-00"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <button
                                                        onClick={() => openNfModal(condo.originalIndex)}
                                                        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center mx-auto ${condo.notaFiscal && condo.notaFiscal.valor > 0 ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                                        title="Detalhes da Nota Fiscal"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <button
                                                        onClick={() => updateCondo(condo.originalIndex, 'nfFeita', !condo.nfFeita)}
                                                        className={`w-4 h-4 rounded-full transition-all mx-auto ${condo.nfFeita ? 'bg-amber-300 shadow-sm' : 'bg-slate-700/40'}`}
                                                    />
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <button
                                                        onClick={() => updateCondo(condo.originalIndex, 'nfEnviada', !condo.nfEnviada)}
                                                        className={`w-4 h-4 rounded-full transition-all mx-auto ${condo.nfEnviada ? 'bg-amber-300 shadow-sm' : 'bg-slate-700/40'}`}
                                                    />
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <button
                                                        onClick={() => updateCondo(condo.originalIndex, 'pagamentoFeito', !condo.pagamentoFeito)}
                                                        className={`w-4 h-4 rounded-full transition-all mx-auto ${condo.pagamentoFeito ? 'bg-emerald-300 shadow-sm' : 'bg-slate-700/40'}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <CurrencyField
                                                        value={condo.receitaBruta || 0}
                                                        onChange={(val) => updateCondo(condo.originalIndex, 'receitaBruta', val)}
                                                        textColor="text-white"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <div className="px-2 py-1 font-bold text-red-400 bg-red-400/5 rounded inline-block min-w-[100px] text-xs">
                                                        {formatCurrency(condo.inssRetido || 0)}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <div className="px-2 py-1 font-bold text-emerald-400 bg-emerald-400/5 rounded inline-block min-w-[100px] text-xs">
                                                        {formatCurrency(condo.receitaLiquida)}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <button
                                                        onClick={() => removeCondo(condo.originalIndex)}
                                                        className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900/80 border-t-2 border-slate-700">
                                        <tr className="text-white font-bold h-16">
                                            <td colSpan={4} className="px-4 py-4 text-xs uppercase tracking-wider text-slate-500">Total do Mês</td>
                                            <td className="px-4 py-4 text-right text-lg border-l border-slate-700/30">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-500 uppercase font-medium">BRL</span>
                                                    {formatCurrency(currentTotals.bruto)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right text-lg border-l border-slate-700/30">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-500 uppercase font-medium">BRL</span>
                                                    <span className="text-red-400">{formatCurrency(currentTotals.inss)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xl inline-block min-w-[140px] shadow-lg shadow-emerald-500/5">
                                                    {formatCurrency(currentTotals.liquida)}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'folha' && (
                        <div className="flex flex-col">
                            <div className="p-4 border-b border-slate-700 bg-slate-900/10 flex justify-end">
                                <button
                                    onClick={addFuncionario}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Funcionário
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-[10px] uppercase text-slate-400 font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="px-2 py-3">Colaboradora</th>
                                            <th className="px-2 py-3">Condomínio</th>
                                            <th className="px-2 py-3 text-right">Salário</th>
                                            <th className="px-2 py-3 text-right text-emerald-400">Extras</th>
                                            <th className="px-2 py-3 text-right text-red-400">Vales</th>
                                            <th className="px-1 py-3 text-center">Faltas</th>
                                            <th className="px-2 py-3 text-right">A Receber</th>
                                            <th className="px-1 py-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sortedFuncs?.map((func) => (
                                            <tr key={func.originalIndex} className="hover:bg-slate-700/10">
                                                <td className="px-2 py-2">
                                                    <input
                                                        value={func.nome}
                                                        onChange={(e) => updateFunc(func.originalIndex, 'nome', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full text-white font-medium text-xs"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-slate-400">
                                                    <input
                                                        value={func.condominio}
                                                        onChange={(e) => updateFunc(func.originalIndex, 'condominio', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full text-xs"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <CurrencyField
                                                        value={func.salario || 0}
                                                        onChange={(val) => updateFunc(func.originalIndex, 'salario', val)}
                                                        textColor="text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <CurrencyField
                                                        value={func.horasExtras || 0}
                                                        onChange={(val) => updateFunc(func.originalIndex, 'horasExtras', val)}
                                                        textColor="text-emerald-400"
                                                        width="w-28"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <CurrencyField
                                                        value={func.vales || 0}
                                                        onChange={(val) => updateFunc(func.originalIndex, 'vales', val)}
                                                        textColor="text-red-400"
                                                        width="w-24"
                                                    />
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        value={func.faltas || 0}
                                                        onChange={(e) => updateFunc(func.originalIndex, 'faltas', parseInt(e.target.value) || 0)}
                                                        className="bg-slate-900/50 border-none outline-none focus:ring-2 focus:ring-amber-500 rounded px-1 py-1 w-12 text-center text-amber-500 font-bold text-xs"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <CurrencyField
                                                        value={func.totalReceber || 0}
                                                        onChange={(val) => updateFunc(func.originalIndex, 'totalReceber', val)}
                                                        textColor="text-blue-400"
                                                        width="w-28"
                                                    />
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    <button
                                                        onClick={() => removeFuncionario(func.originalIndex)}
                                                        className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900/80 border-t-2 border-slate-700">
                                        <tr className="text-white font-bold">
                                            <td colSpan={6} className="px-4 py-4 text-sm uppercase tracking-wider text-slate-400">Total da Folha</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xl inline-block min-w-[140px]">
                                                    {formatCurrency(currentTotals.salarios)}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impostos' && (
                        <div className="flex flex-col">
                            <div className="p-4 border-b border-slate-700 bg-slate-900/10 flex justify-end">
                                <button
                                    onClick={addImposto}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Imposto
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Imposto / Obrigação</th>
                                            <th className="px-6 py-4">Vencimento</th>
                                            <th className="px-6 py-4 text-right">Valor Pago</th>
                                            <th className="px-6 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sortedImpostos?.map((imp, idx) => (
                                            <tr key={idx} className="hover:bg-slate-700/10">
                                                <td className="px-6 py-3 text-white font-medium">
                                                    <input
                                                        value={imp.nome}
                                                        onChange={(e) => updateImposto(idx, 'nome', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 w-full"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        value={imp.vencimento || ''}
                                                        onChange={(e) => updateImposto(idx, 'vencimento', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 w-full text-slate-400"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <CurrencyField
                                                        value={imp.valor || 0}
                                                        onChange={(val) => updateImposto(idx, 'valor', val)}
                                                        textColor="text-red-400"
                                                        width="w-32"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => removeImposto(idx)}
                                                        className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900/80 border-t-2 border-slate-700">
                                        <tr className="text-white font-bold">
                                            <td colSpan={2} className="px-6 py-4 text-sm uppercase tracking-wider text-slate-400">Total de Impostos</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xl inline-block min-w-[140px]">
                                                    {formatCurrency(currentTotals.impostos)}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Nota Fiscal */}
            <Modal
                isOpen={selectedNfCondo !== null}
                onClose={() => setSelectedNfCondo(null)}
                title={`Nota Fiscal - ${selectedNfCondo !== null ? localMonth.condominios?.[selectedNfCondo]?.nome : ''}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">Insira os dados ou faça o upload do PDF da Nota Fiscal emitida para este condomínio para preenchimento automático.</p>

                    {/* Upload de PDF */}
                    <div className="relative border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 rounded-xl p-6 transition-all group overflow-hidden bg-slate-900/40">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={isParsing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                            {isParsing ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                    <div>
                                        <p className="text-sm font-bold text-indigo-400">Lendo Nota Fiscal...</p>
                                        <p className="text-xs text-slate-500">Extraindo valor, data e descrição</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-800 rounded-full group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors text-slate-400">
                                        <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Fazer upload do PDF da Nota</p>
                                        <p className="text-xs text-slate-500">Para auto-preencher os dados abaixo</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Visualizar Arquivo (Se existir Base64) */}
                    {tempNfData.arquivoBase64 && (
                        <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                            <div className="flex items-center gap-3 overflow-hidden text-emerald-400">
                                <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                                    <FileCheck className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-bold truncate">{tempNfData.nomeArquivo || 'Nota_Fiscal.pdf'}</p>
                                    <p className="text-xs text-slate-500">Arquivo anexado e pronto para salvar</p>
                                </div>
                            </div>
                            <button
                                onClick={openPdfPreview}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> Visualizar
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data de Emissão</label>
                            <input
                                type="date"
                                value={tempNfData.dataEmissao}
                                onChange={(e) => setTempNfData({ ...tempNfData, dataEmissao: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor da Nota (R$)</label>
                            <input
                                type="text"
                                value={
                                    tempNfData.valor
                                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tempNfData.valor)
                                        : 'R$ 0,00'
                                }
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setTempNfData({ ...tempNfData, valor: val ? parseFloat(val) / 100 : 0 });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-amber-400 font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição do Serviço</label>
                        <textarea
                            rows={3}
                            value={tempNfData.descricao}
                            onChange={(e) => setTempNfData({ ...tempNfData, descricao: e.target.value })}
                            placeholder="Ex: Serviços de portaria e limpeza referentes ao mês de..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setSelectedNfCondo(null)}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={saveNfData}
                            className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Salvar Nota Fiscal
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap overflow-hidden ${active ? 'border-indigo-500 text-indigo-400 bg-slate-800/80 rounded-t-lg' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function SummaryCard({ label, value, color = "text-white", special = false }: { label: string, value: string, color?: string, special?: boolean }) {
    return (
        <div className={`border border-slate-700 rounded-xl p-5 ${special ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900' : 'bg-slate-900/50'}`}>
            <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
            <h3 className={`text-xl font-bold ${color}`}>{value}</h3>
        </div>
    );
}

interface CurrencyFieldProps {
    value: number;
    onChange: (val: number) => void;
    textColor?: string;
    width?: string;
}

function CurrencyField({ value, onChange, textColor = "text-white", width = "w-24" }: CurrencyFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value.toString());

    React.useEffect(() => {
        if (!isEditing) {
            setTempValue(value.toString());
        }
    }, [value, isEditing]);

    const formatBR = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val).replace(/\s/g, '');
    };

    if (!isEditing) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className={`flex items-center justify-end px-2 py-1.5 bg-slate-900/40 border border-transparent hover:border-slate-600 rounded-lg cursor-text transition-all ${textColor} font-bold group min-w-[90px] inline-flex text-xs`}
            >
                {formatBR(value)}
            </div>
        );
    }

    return (
        <div className={`flex items-center bg-slate-900 border border-indigo-500 rounded-lg px-1.5 py-1.5 ${width} ml-auto shadow-inner ring-2 ring-indigo-500/20 min-w-[90px]`}>
            <span className="text-slate-500 text-[10px] font-bold mr-0.5">R$</span>
            <input
                autoFocus
                type="number"
                step="0.01"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => {
                    setIsEditing(false);
                    onChange(parseFloat(tempValue) || 0);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setIsEditing(false);
                        onChange(parseFloat(tempValue) || 0);
                    }
                }}
                className="bg-transparent border-none outline-none w-full text-right text-white font-bold text-xs"
            />
        </div>
    );
}
