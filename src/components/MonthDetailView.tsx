import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Building2, Users, Users2, Wallet, Activity, AlertTriangle, TrendingDown, Save, Check, Plus, FileText, Receipt, UploadCloud, Loader2, FileCheck, Eye, Undo2, Redo2, Trash2, StickyNote, Utensils, HandCoins, Tag, Calendar, Circle, CheckCircle2, DollarSign, ShieldCheck, UserMinus, TrendingUp, X, ArrowUpCircle, ArrowDownCircle, ArrowUpDown, ArrowUpNarrowWide, ArrowDownWideNarrow, Copy, FileDown, Zap, BarChart3, Building, ChevronDown, ChevronRight } from 'lucide-react';
import type { MonthlyFinanceData, CondominioData, FuncionarioData, ImpostoData, NotaFiscalData, MonthlyGastoData } from '../modelsFinance';
import { Modal } from './Modal';
import { extractTextFromPdf, parseNfText } from '../lib/pdfParser';
import { ADMIN_CONFIGS } from '../lib/adminConfigs';
import NFDraftGenerator from './NFDraftGenerator';
import { PaymentGeneratorView } from './PaymentGeneratorView';

interface MonthDetailViewProps {
    month: MonthlyFinanceData;
    onBack: () => void;
    onSave: (updated: MonthlyFinanceData) => void;
}

type TabType = 'visao_geral' | 'condominios' | 'folha' | 'rescisoes' | 'impostos' | 'gastos' | 'gerador';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value).replace(/\s/g, '');
};

export function MonthDetailView({ month, onBack, onSave }: MonthDetailViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('visao_geral');
    const [dashboardMode, setDashboardMode] = useState<'financeiro' | 'operacional'>('financeiro');
    const [localMonth, setLocalMonth] = useState<MonthlyFinanceData>(month);
    const [expandedFuncId, setExpandedFuncId] = useState<string | null>(null);
    const [history, setHistory] = useState<MonthlyFinanceData[]>([month]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [isFullNfGeneratorOpen, setIsFullNfGeneratorOpen] = useState(false);
    const [fullNfGeneratorCondoName, setFullNfGeneratorCondoName] = useState<string | null>(null);

    const handleOpenFullNF = (condoName: string) => {
        setFullNfGeneratorCondoName(condoName);
        setIsFullNfGeneratorOpen(true);
    };

    const [isFullPayrollGeneratorOpen, setIsFullPayrollGeneratorOpen] = useState(false);
    const [fullPayrollGeneratorEmployeeId, setFullPayrollGeneratorEmployeeId] = useState<string | null>(null);

    const handleOpenFullPayroll = (employeeId: string) => {
        setFullPayrollGeneratorEmployeeId(employeeId);
        setIsFullPayrollGeneratorOpen(true);
    };

    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [condoSortMethod, setCondoSortMethod] = useState<'value' | 'name' | 'status' | 'admin'>('name');
    const [noteModal, setNoteModal] = useState<{
        isOpen: boolean;
        type: 'condo' | 'func' | 'tax';
        index: number;
        title: string;
        value: string;
    }>({
        isOpen: false,
        type: 'condo',
        index: 0,
        title: '',
        value: ''
    });

    const openNoteModal = (type: 'condo' | 'func' | 'tax', index: number, title: string, value: string) => {
        setNoteModal({
            isOpen: true,
            type,
            index,
            title,
            value: value || ''
        });
    };

    const saveNoteModal = () => {
        if (noteModal.type === 'condo') updateCondo(noteModal.index, 'observacao', noteModal.value);
        else if (noteModal.type === 'func') updateFunc(noteModal.index, 'observacao', noteModal.value);
        else if (noteModal.type === 'tax') updateImposto(noteModal.index, 'observacao', noteModal.value);
        
        setNoteModal(prev => ({ ...prev, isOpen: false }));
    };
    const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
    const [editingGastoIndex, setEditingGastoIndex] = useState<number | null>(null);
    const [gastoFormData, setGastoFormData] = useState<Partial<MonthlyGastoData>>({
        descricao: '',
        valor: 0,
        categoria: 'Outros',
        data: new Date().toISOString().split('T')[0]
    });



    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    // Ignora a primeira renderização para não disparar save à toa
    const isFirstRender = useRef(true);
    const localMonthRef = useRef(localMonth);
    const hasChangesRef = useRef(hasChanges);

    useEffect(() => {
        localMonthRef.current = localMonth;
        hasChangesRef.current = hasChanges;
    }, [localMonth, hasChanges]);

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
            const currGastos = (localMonth.gastos || []).reduce((acc, g) => acc + (Number(g.valor) || 0), 0);

            const lucroEstimado = (currBruto - currInss) - (currSalarios + currImpostos + currGastos);

            onSaveRef.current({
                ...localMonth,
                lucroEstimado,
                totalGastos: currGastos,
                totalSalarios: currSalarios,
                totalRescisao: validFuncs.reduce((acc, f) => acc + (Number(f.rescisaoFerias) || 0), 0)
            });

            setHasChanges(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (hasChangesRef.current) {
                // Força salvamento ao sair se houver alterações pendentes
                onSaveRef.current(localMonthRef.current);
            }
        };
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

    // Modais de Adição
    const [isAddCondoModalOpen, setIsAddCondoModalOpen] = useState(false);
    const [newCondoData, setNewCondoData] = useState({ nome: '', receitaBruta: 0, inssRetido: 0, administradora: '' });

    const [isAddFuncModalOpen, setIsAddFuncModalOpen] = useState(false);
    const [isMassImportModalOpen, setIsMassImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [newFuncData, setNewFuncData] = useState({ nome: '', condominio: '', salario: 0 });

    const [isAddImpModalOpen, setIsAddImpModalOpen] = useState(false);
    const [newImpData, setNewImpData] = useState({ nome: '', valor: 0, vencimento: '' });

    const [isAddRescisaoModalOpen, setIsAddRescisaoModalOpen] = useState(false);
    const [newRescisaoData, setNewRescisaoData] = useState({ 
        nome: '', 
        condominio: '', 
        tipo: 'Rescisão' as 'Rescisão' | 'Férias',
        valor: 0 
    });


    const handleSaveNewCondo = () => {
        if (!newCondoData.nome) return alert("Nome é obrigatório");
        const fresh: CondominioData = {
            id: crypto.randomUUID(),
            nome: newCondoData.nome,
            cnpj: '',
            receitaBruta: newCondoData.receitaBruta,
            inssRetido: newCondoData.inssRetido,
            receitaLiquida: newCondoData.receitaBruta - newCondoData.inssRetido,
            administradora: newCondoData.administradora,
            nfFeita: false,
            nfEnviada: false,
            pagamentoFeito: false
        };
        const newList = [...(localMonth.condominios || []), fresh];
        updateHistory({ ...localMonth, condominios: newList });
        setIsAddCondoModalOpen(false);
        setNewCondoData({ nome: '', receitaBruta: 0, inssRetido: 0, administradora: '' });
    };

    const handleSaveNewFunc = () => {
        if (!newFuncData.nome) return alert("Nome é obrigatório");
        const fresh: FuncionarioData = {
            id: crypto.randomUUID(),
            nome: newFuncData.nome,
            condominio: newFuncData.condominio,
            salario: newFuncData.salario,
            horasExtras: 0,
            vales: 0,
            faltas: 0,
            rescisaoFerias: 0,
            totalReceber: newFuncData.salario,
            pagamentoFeito: false
        };
        const newList = [...(localMonth.funcionarios || []), fresh];
        updateHistory({ ...localMonth, funcionarios: newList });
        setIsAddFuncModalOpen(false);
        setNewFuncData({ nome: '', condominio: '', salario: 0 });
    };

    const handleSaveNewImp = () => {
        if (!newImpData.nome) return alert("Nome é obrigatório");
        const fresh: ImpostoData = {
            id: crypto.randomUUID(),
            nome: newImpData.nome,
            valor: newImpData.valor,
            vencimento: newImpData.vencimento,
            pagamentoFeito: false
        };
        const newList = [...(localMonth.impostos || []), fresh];
        updateHistory({ ...localMonth, impostos: newList });
        setIsAddImpModalOpen(false);
        setNewImpData({ nome: '', valor: 0, vencimento: '' });
    };


    const handleSaveRescisao = () => {
        if (!newRescisaoData.nome) return alert("Nome é obrigatório");
        
        const fresh: FuncionarioData = {
            id: crypto.randomUUID(),
            nome: newRescisaoData.nome,
            condominio: newRescisaoData.condominio,
            salario: 0,
            horasExtras: 0,
            vales: 0,
            faltas: 0,
            cargo: newRescisaoData.tipo,
            rescisaoFerias: newRescisaoData.valor,
            totalReceber: 0,
            pagamentoFeito: false
        };
        
        const newList = [...(localMonth.funcionarios || []), fresh];
        updateHistory({ ...localMonth, funcionarios: newList });
        setIsAddRescisaoModalOpen(false);
        setNewRescisaoData({ nome: '', condominio: '', tipo: 'Rescisão', valor: 0 });
    };

    const updateCondo = (index: number, field: keyof CondominioData, value: string | number | boolean) => {
        const list = [...(localMonth.condominios || [])];
        const item = { ...list[index], [field]: value };

        if (field === 'receitaBruta') {
            item.inssRetido = (Number(item.receitaBruta) || 0) * (localMonth.inssRate || 0.11);
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

    const handleInssRateChange = (newRate: number) => {
        const list = [...(localMonth.condominios || [])].map(c => {
            if (c.nome?.toUpperCase() === 'TOTAL' || c.nome?.toUpperCase() === 'TOTAL GERAL') return c;
            const inss = (Number(c.receitaBruta) || 0) * newRate;
            return {
                ...c,
                inssRetido: inss,
                receitaLiquida: (Number(c.receitaBruta) || 0) - inss
            };
        });

        // Recalcular totais globais
        const validCondos = list.filter(c =>
            c.nome?.toUpperCase() !== 'TOTAL' &&
            c.nome?.toUpperCase() !== 'TOTAL GERAL'
        );
        const totalBruto = validCondos.reduce((acc, c) => acc + (Number(c.receitaBruta) || 0), 0);
        const totalInss = validCondos.reduce((acc, c) => acc + (Number(c.inssRetido) || 0), 0);
        const totalLiquida = totalBruto - totalInss;

        updateHistory({
            ...localMonth,
            inssRate: newRate,
            condominios: list,
            receitaBruta: totalBruto,
            inssRetido: totalInss,
            receitaLiquida: totalLiquida
        });
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

    const updateFunc = (index: number, field: keyof FuncionarioData, value: string | number | boolean) => {
        const list = [...(localMonth.funcionarios || [])];
        const updated = { ...list[index], [field]: value };

        // Auto-calculate: Total = Salário + Horas Extras - Vales - Faltas (R$)
        // Keep rescisao separate from the employee's main "Total a Receber"
        if (field === 'salario' || field === 'horasExtras' || field === 'vales' || field === 'faltas') {
            const sal = Number(field === 'salario' ? value : updated.salario) || 0;
            const extras = Number(field === 'horasExtras' ? value : updated.horasExtras) || 0;
            const vales = Number(field === 'vales' ? value : updated.vales) || 0;
            const faltas = Number(field === 'faltas' ? value : updated.faltas) || 0;
            updated.totalReceber = Math.max(0, sal + extras - vales - faltas);
        }

        list[index] = updated;
        const totalSalarios = list.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);

        updateHistory({ ...localMonth, funcionarios: list, totalSalarios });
        setHasChanges(true);
    };

    const updateImposto = (index: number, field: keyof ImpostoData, value: string | number | boolean) => {
        const list = [...(localMonth.impostos || [])];
        list[index] = { ...list[index], [field]: value };

        const totalImpostos = list.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

        updateHistory({ ...localMonth, impostos: list, totalImpostos });
        setHasChanges(true);
    };

    const updateGasto = (index: number, field: keyof MonthlyGastoData, value: string | number | boolean) => {
        const list = [...(localMonth.gastos || [])];
        list[index] = { ...list[index], [field]: value } as MonthlyGastoData;

        const totalGastos = list.reduce((acc, g) => acc + (Number(g.valor) || 0), 0);

        updateHistory({ ...localMonth, gastos: list, totalGastos });
        setHasChanges(true);
    };

    const addCondo = () => {
        setIsAddCondoModalOpen(true);
    };

    const removeCondo = (index: number) => {
        const newList = (localMonth.condominios || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, condominios: newList });
        setHasChanges(true);
    };

    const addFuncionario = () => {
        setIsAddFuncModalOpen(true);
    };

    const removeFuncionario = (index: number) => {
        const newList = (localMonth.funcionarios || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, funcionarios: newList });
        setHasChanges(true);
    };

    const addImposto = () => {
        setIsAddImpModalOpen(true);
    };

    const removeImposto = (index: number) => {
        const newList = (localMonth.impostos || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, impostos: newList });
        setHasChanges(true);
    };

    const removeGasto = (index: number) => {
        const newList = (localMonth.gastos || []).filter((_, i) => i !== index);
        updateHistory({ ...localMonth, gastos: newList });
        setHasChanges(true);
    };

    const handleOpenGastoModal = (index: number | null = null) => {
        if (index !== null) {
            const g = (localMonth.gastos || [])[index];
            setGastoFormData({ ...g });
            setEditingGastoIndex(index);
        } else {
            setGastoFormData({
                descricao: '',
                valor: 0,
                categoria: 'Outros',
                data: new Date().toISOString().split('T')[0]
            });
            setEditingGastoIndex(null);
        }
        setIsGastoModalOpen(true);
    };

    const handleSaveGasto = () => {
        const gastos = [...(localMonth.gastos || [])];
        const newGasto: MonthlyGastoData = {
            id: gastoFormData.id || crypto.randomUUID(),
            descricao: gastoFormData.descricao || 'Novo Gasto',
            valor: Number(gastoFormData.valor) || 0,
            pago: gastoFormData.pago || false,
            categoria: gastoFormData.categoria as any || 'Outros',
            data: gastoFormData.data || new Date().toISOString().split('T')[0],
            monthId: localMonth.id
        };

        if (editingGastoIndex !== null) {
            gastos[editingGastoIndex] = newGasto;
        } else {
            gastos.push(newGasto);
        }

        updateHistory({ ...localMonth, gastos });
        setIsGastoModalOpen(false);
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
        const base = (localMonth.condominios || [])
            .map((c, originalIndex) => ({ ...c, originalIndex }))
            .filter(c => c.nome?.toUpperCase() !== 'TOTAL' && c.nome?.toUpperCase() !== 'TOTAL GERAL');

        switch (condoSortMethod) {
            case 'name':
                return base.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            case 'admin':
                return base.sort((a, b) => (a.administradora || '').localeCompare(b.administradora || ''));
            case 'status':
                return base.sort((a, b) => {
                    if (a.pagamentoFeito === b.pagamentoFeito) return (a.nome || '').localeCompare(b.nome || '');
                    return a.pagamentoFeito ? -1 : 1;
                });
            case 'value':
            default:
                return base.sort((a, b) => (Number(b.receitaBruta) || 0) - (Number(a.receitaBruta) || 0));
        }
    }, [localMonth.condominios, condoSortMethod]);

    const sortedFuncs = useMemo(() => {
        return (localMonth.funcionarios || [])
            .map((f, originalIndex) => ({ ...f, originalIndex }))
            .filter(f => f.nome?.toUpperCase() !== 'TOTAL')
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }, [localMonth.funcionarios]);

    const rescisoesFuncs = useMemo(() => {
        return sortedFuncs.filter(f => (f.rescisaoFerias || 0) > 0);
    }, [sortedFuncs]);

    const teamStats = useMemo(() => {
        return {
            totalCount: sortedFuncs.length,
            totalValue: sortedFuncs.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0)
        };
    }, [sortedFuncs]);


    const sortedImpostos = useMemo(() => {
        const parseDate = (dStr?: string) => {
            if (!dStr || dStr.trim() === '') return Infinity;
            const parts = dStr.split('/');
            if (parts.length < 2) return Infinity;
            const day = parseInt(parts[0]) || 0;
            const month = parseInt(parts[1]) || 0;
            const year = parts.length === 3 ? parseInt(parts[2]) : 2026;
            return new Date(year, month - 1, day).getTime();
        };

        return (localMonth.impostos || [])
            .map((imp, originalIndex) => ({ ...imp, originalIndex }))
            .sort((a, b) => parseDate(a.vencimento) - parseDate(b.vencimento));
    }, [localMonth.impostos]);

    const allNfFeita = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.nfFeita), [sortedCondos]);
    const allNfEnviada = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.nfEnviada), [sortedCondos]);
    const allPagamento = useMemo(() => sortedCondos.length > 0 && sortedCondos.every(c => c.pagamentoFeito), [sortedCondos]);
    const allFuncsPago = useMemo(() => sortedFuncs.length > 0 && sortedFuncs.every(f => f.pagamentoFeito), [sortedFuncs]);
    const allImpostosPago = useMemo(() => sortedImpostos.length > 0 && sortedImpostos.every(i => i.pagamentoFeito), [sortedImpostos]);

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
        const gastos = (localMonth.gastos || []).reduce((acc, g) => acc + (Number(g.valor) || 0), 0);
        const rescisoes = (localMonth.funcionarios || []).reduce((acc, f) => acc + (Number(f.rescisaoFerias) || 0), 0);

        return { bruto, liquida, inss, salarios, impostos, gastos, rescisoes };
    }, [localMonth]);

    const paymentStats = useMemo(() => {
        const validCondos = (localMonth.condominios || []).filter(c =>
            c.nome?.toUpperCase() !== 'TOTAL' &&
            c.nome?.toUpperCase() !== 'TOTAL GERAL'
        );
        const paid = validCondos.filter(c => c.pagamentoFeito);
        const unpaid = validCondos.filter(c => !c.pagamentoFeito);
        const totalPaid = paid.reduce((acc, c) => acc + (Number(c.receitaLiquida) || 0), 0);
        const totalPending = unpaid.reduce((acc, c) => acc + (Number(c.receitaLiquida) || 0), 0);
        return { 
            totalPaid, 
            totalPending,
            countPaid: paid.length, 
            countUnpaid: unpaid.length,
            totalCount: validCondos.length
        };
    }, [localMonth.condominios]);

    const employeePaymentStats = useMemo(() => {
        const validFuncs = (localMonth.funcionarios || []).filter(f =>
            f.nome?.toUpperCase() !== 'TOTAL'
        );
        const paid = validFuncs.filter(f => f.pagamentoFeito);
        const unpaid = validFuncs.filter(f => !f.pagamentoFeito);
        const totalPaid = paid.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);
        const totalPending = unpaid.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);
        return {
            totalPaid,
            totalPending,
            countPaid: paid.length,
            countUnpaid: unpaid.length,
            totalCount: validFuncs.length
        };
    }, [localMonth.funcionarios]);

    const gastosByCategory = useMemo(() => {
        const cats = {
            Pagamentos: 0,
            Vales: 0,
            Restaurantes: 0,
            Outros: 0
        };
        (localMonth.gastos || []).forEach(g => {
            const cat = g.categoria || 'Outros';
            if (cat in cats) {
                cats[cat as keyof typeof cats] += Number(g.valor) || 0;
            } else {
                cats.Outros += Number(g.valor) || 0;
            }
        });
        return cats;
    }, [localMonth.gastos]);

    const lucroCalculado = currentTotals.liquida - (currentTotals.salarios + currentTotals.impostos + currentTotals.gastos);

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

    const handleMassImport = () => {
        if (!importText.trim()) return;

        // Simple parser for the format:
        // Name
        // Salario base: R$X
        // + Extras: R$X
        // - Faltas: R$X
        // - Vales: R$X
        // = LÍQUIDO: R$X
        
        const blocks = importText.split('\n\n').filter(b => b.trim());
        const list = [...(localMonth.funcionarios || [])];
        let importedCount = 0;

        blocks.forEach(block => {
            const lines = block.split('\n').map(l => l.trim());
            if (lines.length < 2) return;

            const nameLine = lines[0];
            let nome = nameLine;
            let condo = 'Importado';

            // Support formats: "Name — Condo" or "Name - Condo"
            if (nameLine.includes(' — ')) {
                const parts = nameLine.split(' — ');
                nome = parts[0].trim();
                condo = parts[1].trim();
            } else if (nameLine.includes(' - ')) {
                const parts = nameLine.split(' - ');
                nome = parts[0].trim();
                condo = parts[1].trim();
            }

            const getVal = (regex: RegExp) => {
                const match = block.match(regex);
                if (match) {
                    // Clean up the number: remove thousands separator (.), replace decimal separator (,) with (.)
                    return parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0;
                }
                return 0;
            };

            const sal = getVal(/Salario base: R\$\s*([\d.,]+)/i);
            const extras = getVal(/\+ Extras: R\$\s*([\d.,]+)/i);
            const faltas = getVal(/- Faltas: R\$\s*([\d.,]+)/i);
            const vales = getVal(/- Vales: R\$\s*([\d.,]+)/i);

            // Find existing or create new
            const idx = list.findIndex(f => f.nome.trim().toLowerCase() === nome.trim().toLowerCase());
            if (idx !== -1) {
                list[idx] = {
                    ...list[idx],
                    condominio: condo,
                    salario: sal,
                    horasExtras: extras,
                    faltas: faltas,
                    vales: vales,
                    totalReceber: Math.max(0, sal + extras - faltas - vales)
                };
                importedCount++;
            } else {
                list.push({
                    id: crypto.randomUUID(),
                    monthId: localMonth.id,
                    nome,
                    condominio: condo,
                    salario: sal,
                    horasExtras: extras,
                    faltas: faltas,
                    vales: vales,
                    totalReceber: Math.max(0, sal + extras - faltas - vales),
                    pagamentoFeito: false,
                    contaConfirmada: false
                } as any);
                importedCount++;
            }
        });

        const totalSalarios = list.reduce((acc, f) => acc + (Number(f.totalReceber) || 0), 0);
        updateHistory({ ...localMonth, funcionarios: list, totalSalarios });
        setHasChanges(true);
        setIsMassImportModalOpen(false);
        setImportText('');
        alert(`${importedCount} funcionários processados com sucesso!`);
    };

    const handleCopyHolerite = async (func: any) => {
        const base = Number(func.salario) || 0;
        const extras = Number(func.horasExtras) || 0;
        const vales = Number(func.vales) || 0;
        const faltas = Number(func.faltas) || 0;
        const total = Number(func.totalReceber) || 0;

        const text = `${func.nome}\n\nSalario:${formatCurrency(base)}\nExtras:${formatCurrency(extras)}\nFaltas:${formatCurrency(faltas)}\nvales:${formatCurrency(vales)}\n\nTOTAL:${formatCurrency(total)}`;
        
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const renderFuncRow = (func: any) => {
        const isExpanded = expandedFuncId === func.id;
        
        return (
            <React.Fragment key={func.originalIndex}>
                <tr 
                    onClick={() => setExpandedFuncId(isExpanded ? null : (func.id || 'temp'))}
                    className={`hover:bg-slate-700/10 cursor-pointer h-14 transition-colors ${isExpanded ? 'bg-slate-700/20' : ''}`}
                >
                    <td className="px-1 py-2">
                        <div className="flex items-center gap-2">
                             <div className="transition-transform duration-200">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                             </div>
                             <input
                                value={func.nome}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateFunc(func.originalIndex, 'nome', e.target.value)}
                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-white font-black text-xs uppercase tracking-tight"
                            />
                        </div>
                    </td>
                    <td className="px-1 py-2">
                        <input
                            value={func.condominio}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateFunc(func.originalIndex, 'condominio', e.target.value)}
                            className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-xs text-slate-400"
                        />
                    </td>
                    <td className="px-1 py-2 text-right w-24">
                        <div onClick={(e) => e.stopPropagation()}>
                            <CurrencyField
                                value={func.salario || 0}
                                onChange={(val) => updateFunc(func.originalIndex, 'salario', val)}
                                textColor="text-white"
                                width="w-full"
                            />
                        </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                        <div onClick={(e) => e.stopPropagation()}>
                            <CurrencyField
                                value={func.totalReceber || 0}
                                onChange={(val) => updateFunc(func.originalIndex, 'totalReceber', val)}
                                textColor="text-blue-400"
                                width="w-28"
                            />
                        </div>
                    </td>
                    <td className="px-1 py-2 text-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); updateFunc(func.originalIndex, 'contaConfirmada', !func.contaConfirmada); }}
                            className={`w-4 h-4 rounded-full transition-all mx-auto ${func.contaConfirmada ? 'bg-blue-400 shadow-sm shadow-blue-400/20' : 'bg-slate-700/40'}`}
                            title="Conta Confirmada"
                        />
                    </td>
                    <td className="px-1 py-2 text-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); updateFunc(func.originalIndex, 'pagamentoFeito', !func.pagamentoFeito); }}
                            className={`w-4 h-4 rounded-full transition-all mx-auto ${func.pagamentoFeito ? 'bg-emerald-300 shadow-sm shadow-emerald-400/20' : 'bg-slate-700/40'}`}
                        />
                    </td>
                    <td className="px-1 py-2 text-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); removeFuncionario(func.originalIndex); }}
                            className="p-1 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </td>
                </tr>
                {isExpanded && (
                    <tr className="bg-slate-900/60 shadow-inner">
                        <td colSpan={7} className="px-4 py-6 border-y border-slate-700/50">
                            {/* Tira Horizontal Ultra-Compacta */}
                            <div className="flex items-center gap-8 min-h-[140px]">
                                {/* 1. Status (Esquerda) */}
                                <div className="flex flex-col gap-2 w-[160px] shrink-0">
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Status</span>
                                     <button
                                        onClick={() => updateFunc(func.originalIndex, 'contaConfirmada', !func.contaConfirmada)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${func.contaConfirmada ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                     >
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${func.contaConfirmada ? 'bg-blue-400 text-slate-900' : 'bg-slate-700 text-slate-600'}`}>
                                            {func.contaConfirmada && <Check className="w-2 h-2 font-bold" />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tight">{func.contaConfirmada ? 'Conta OK' : 'Confirmar'}</span>
                                     </button>
                                     <button
                                        onClick={() => updateFunc(func.originalIndex, 'pagamentoFeito', !func.pagamentoFeito)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${func.pagamentoFeito ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                     >
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${func.pagamentoFeito ? 'bg-emerald-400 text-slate-900' : 'bg-slate-700 text-slate-600'}`}>
                                            {func.pagamentoFeito && <CheckCircle2 className="w-2 h-2 font-bold" />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tight">{func.pagamentoFeito ? 'Pago' : 'Pendente'}</span>
                                     </button>
                                </div>

                                {/* 2. A Conta (Meio) */}
                                <div className="bg-slate-900/90 border border-slate-700 p-5 rounded-2xl flex flex-col gap-4 min-w-[280px] shadow-xl">
                                     <div className="grid grid-cols-[1fr,auto] gap-x-6 gap-y-2.5 items-center">
                                         <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Base:</span>
                                         <CurrencyField value={func.salario || 0} onChange={(v) => updateFunc(func.originalIndex, 'salario', v)} width="w-28" />
                                         
                                         <span className="text-emerald-500/80 font-bold text-[9px] uppercase tracking-wider">Extras:</span>
                                         <CurrencyField value={func.horasExtras || 0} onChange={(v) => updateFunc(func.originalIndex, 'horasExtras', v)} textColor="text-emerald-400" width="w-28" />
                                         
                                         <span className="text-rose-500/80 font-bold text-[9px] uppercase tracking-wider">Descontos:</span>
                                         <CurrencyField value={(func.faltas || 0) + (func.vales || 0)} onChange={(v) => updateFunc(func.originalIndex, 'vales', v)} textColor="text-rose-400" width="w-28" />
                                     </div>
                                     <div className="h-px bg-slate-800" />
                                     <div className="flex justify-between items-center px-1 mb-1">
                                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Total</span>
                                         <span className="text-2xl font-black text-emerald-400 tabular-nums">{formatCurrency(func.totalReceber)}</span>
                                     </div>
                                     <button 
                                        onClick={() => handleCopyHolerite(func)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest shadow-md active:scale-95"
                                     >
                                        <Copy className="w-3.5 h-3.5" /> COPIAR HOLERITE
                                     </button>
                                </div>

                                {/* 3. Observações (Flex-1) */}
                                <div className="flex flex-col gap-2 flex-1 h-full">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações</span>
                                    <textarea 
                                        value={func.observacao || ''}
                                        onChange={(e) => updateFunc(func.originalIndex, 'observacao', e.target.value)}
                                        placeholder="Notas..."
                                        className="w-full flex-1 bg-slate-950/40 border border-slate-700/50 rounded-xl p-3 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-slate-600 transition-all resize-none"
                                    />
                                </div>

                                {/* 4. Ações (Direita) */}
                                <div className="flex flex-col justify-end gap-2 w-[100px] shrink-0 pb-1">
                                    <button 
                                        onClick={() => removeFuncionario(func.originalIndex)}
                                        className="w-full py-2.5 text-slate-600 hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
                                    >
                                        <Trash2 className="w-3 h-3" /> Excluir
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
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
                <div className="flex flex-col border-b border-slate-700 bg-slate-900/40">
                    {/* Dashboard Navigation */}
                    <div className="flex flex-wrap gap-2 p-4 border-b border-slate-700/50">
                        <button 
                            onClick={() => { setDashboardMode('financeiro'); setActiveTab('visao_geral'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visao_geral' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                        >
                            <Activity className="w-3.5 h-3.5" /> Visão Geral
                        </button>
                        <button 
                            onClick={() => { setDashboardMode('financeiro'); setActiveTab('condominios'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'condominios' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                        >
                            <Building2 className="w-3.5 h-3.5" /> Condomínios
                        </button>
                        <button 
                            onClick={() => { setDashboardMode('operacional'); setActiveTab('folha'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardMode === 'operacional' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                        >
                            <Users2 className="w-3.5 h-3.5" /> Colaboradores
                        </button>
                        <button 
                            onClick={() => { setDashboardMode('financeiro'); setActiveTab('impostos'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'impostos' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                        >
                            <Wallet className="w-3.5 h-3.5" /> Impostos
                        </button>
                        <button 
                            onClick={() => { setDashboardMode('financeiro'); setActiveTab('gastos'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gastos' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                        >
                            <TrendingDown className="w-3.5 h-3.5" /> Gastos
                        </button>
                    </div>

                    {/* Secondary Navigation (only for Colaboradores) */}
                    {dashboardMode === 'operacional' && (
                        <div className="flex overflow-x-auto px-4 pt-2 hide-scrollbar">
                            <TabButton active={activeTab === 'folha'} onClick={() => setActiveTab('folha')} icon={<Users className="w-4 h-4" />} label="Folha de Pagamento" />
                            <TabButton active={activeTab === 'rescisoes'} onClick={() => setActiveTab('rescisoes')} icon={<Calendar className="w-4 h-4" />} label="Rescisões/Férias" />
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-800 min-h-[500px]">
                    {activeTab === 'visao_geral' && (
                        <div className="p-6 space-y-8 animate-in fade-in duration-300">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-emerald-400" /> Resumo Estratégico
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <SummaryCard title="Entrada" value={currentTotals.bruto} color="text-blue-400" icon={<ArrowUpCircle className="w-4 h-4" />} />
                                    <SummaryCard title="Saída" value={currentTotals.inss + currentTotals.salarios + currentTotals.impostos + currentTotals.gastos + currentTotals.rescisoes} color="text-red-400" icon={<ArrowDownCircle className="w-4 h-4" />} />
                                    <SummaryCard 
                                        title="Lucro" 
                                        value={currentTotals.liquida - (currentTotals.salarios + currentTotals.impostos + currentTotals.gastos + currentTotals.rescisoes)} 
                                        color={lucroCalculado >= 0 ? "text-emerald-400" : "text-rose-500"} 
                                        icon={<TrendingUp className="w-4 h-4" />}
                                        subtitle={currentTotals.bruto > 0 ? `${((currentTotals.liquida - (currentTotals.salarios + currentTotals.impostos + currentTotals.gastos + currentTotals.rescisoes)) / currentTotals.bruto * 100).toFixed(1)}% de margem` : '0% de margem'}
                                    />
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-purple-400" /> Operação
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-4 bg-slate-800 rounded-lg">
                                            <h4 className="text-3xl font-black text-white mb-2">{localMonth.condominios?.length || 0}</h4>
                                            <span className="text-xs uppercase font-medium text-slate-400">Condomínios</span>
                                        </div>
                                        <div className="p-4 bg-slate-800 rounded-lg border border-indigo-500/30 flex flex-col items-center justify-center">
                                            <h4 className="text-3xl font-black text-white mb-1">{teamStats.totalCount}</h4>
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Colaboradores</span>
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
                        <>
                            <div className="flex flex-col">
                                {/* Reestruturação do Cabeçalho - Totais + Botão de Adição */}
                                <div className="bg-slate-900 shadow-xl border border-slate-700/50 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-end">
                                                Bruto Total <span className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-bold">{sortedCondos.length}</span>
                                            </p>
                                            <p className="text-2xl font-black text-blue-400">{formatCurrency(currentTotals.bruto)}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-700"></div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">INSS Retido</p>
                                            <p className="text-2xl font-black text-red-400">-{formatCurrency(currentTotals.inss)}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-700"></div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Líquido Unificado</p>
                                            <p className="text-2xl font-black text-blue-400">{formatCurrency(currentTotals.liquida)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 ml-auto">
                                        {/* INSS Rate Toggle */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest hidden md:block">Taxa INSS</span>
                                            <div className="flex bg-slate-800/50 p-0.5 rounded-lg border border-slate-700/50">
                                                <button 
                                                    onClick={() => handleInssRateChange(0.11)}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-tight transition-all ${Math.abs((localMonth.inssRate || 0.11) - 0.11) < 0.001 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    11%
                                                </button>
                                                <button 
                                                    onClick={() => handleInssRateChange(0.13)}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-tight transition-all ${Math.abs((localMonth.inssRate || 0.11) - 0.13) < 0.001 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    13%
                                                </button>
                                            </div>
                                        </div>

                                        <button onClick={() => setIsAddCondoModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Novo Condomínio
                                        </button>
                                    </div>
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
                                                <th className="px-1 py-3 text-right" colSpan={3}>
                                                    <div className="flex bg-slate-800 p-0.5 rounded-md border border-slate-700/50 w-fit ml-auto">
                                                        {[
                                                            { id: 'name', icon: <ArrowUpDown className="w-3 h-3" />, title: 'Ordem Alfabética' },
                                                            { id: 'value', icon: <ArrowDownWideNarrow className="w-3 h-3" />, title: 'Maior Valor' },
                                                            { id: 'admin', icon: <ArrowUpNarrowWide className="w-3 h-3" />, title: 'Administradora' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setCondoSortMethod(opt.id as any)}
                                                                className={`p-1 rounded-md transition-all ${condoSortMethod === opt.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                title={opt.title}
                                                            >
                                                                {opt.icon}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {sortedCondos?.map((condo) => (
                                                <React.Fragment key={condo.originalIndex}>
                                                    <tr className="hover:bg-slate-700/10 group h-14">
                                                    <td className="px-2 py-2">
                                                        <div className="flex flex-col gap-0.5 w-full max-w-[250px]">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <input
                                                                    value={condo.nome}
                                                                    onChange={(e) => updateCondo(condo.originalIndex, 'nome', e.target.value)}
                                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-auto text-white font-black text-sm uppercase tracking-tight truncate max-w-[180px]"
                                                                    placeholder="Nome"
                                                                    title={condo.nome}
                                                                />
                                                                {condo.administradora && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-700/50 text-slate-400 border border-slate-700">
                                                                        {condo.administradora}
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => openNfModal(condo.originalIndex)}
                                                                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${condo.notaFiscal && condo.notaFiscal.valor > 0 ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                                                title="Resumo da Nota Fiscal"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenFullNF(condo.nome)}
                                                                className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-all"
                                                                title="Gerar Nota Fiscal Completa"
                                                            >
                                                                <Receipt className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
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
                                                    <td className="px-1 py-2 text-center">
                                                        <button
                                                            onClick={() => openNoteModal('condo', condo.originalIndex, condo.nome, condo.observacao || '')}
                                                            className={`p-1.5 rounded-lg transition-all ${condo.observacao ? 'text-amber-400 bg-amber-400/10 shadow-sm border border-amber-400/20' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
                                                            title="Observação"
                                                        >
                                                            <StickyNote className={`w-3.5 h-3.5 ${condo.observacao ? 'animate-pulse' : ''}`} />
                                                        </button>
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
                                                    </React.Fragment>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bottom Payment Summary */}
                                <div className="p-8 bg-slate-900/40 border-t border-slate-700 mt-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Recebido</p>
                                                <h4 className="text-xl font-black text-white">{formatCurrency(paymentStats.totalPaid)}</h4>
                                            </div>
                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Total Pendente</p>
                                                <h4 className="text-xl font-black text-white">{formatCurrency(paymentStats.totalPending)}</h4>
                                            </div>
                                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Condomínios Pagos</p>
                                                <h4 className="text-lg font-black text-white">{paymentStats.countPaid} <span className="text-slate-600 text-xs font-bold">/ {paymentStats.totalCount}</span></h4>
                                            </div>
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Aguardando Pagamento</p>
                                                <h4 className="text-lg font-black text-amber-500">{paymentStats.countUnpaid}</h4>
                                            </div>
                                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observações - Condomínios */}
                        </>
                    )}

                    {activeTab === 'folha' && (
                        <div className="flex flex-col">
                            <div className="bg-slate-900 shadow-xl border border-slate-700/50 p-6 rounded-3xl flex flex-wrap justify-between items-center gap-6">
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Colaboradores</span>
                                        <span className="text-xl font-black text-white">{teamStats.totalCount}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-slate-800 pl-8">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total da Folha</span>
                                        <span className="text-xl font-black text-indigo-400">{formatCurrency(currentTotals.salarios)}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsAddFuncModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Adicionar Individual
                                </button>
                                <button onClick={() => setIsMassImportModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 flex items-center gap-2">
                                    <FileDown className="w-4 h-4" /> Importar Planilha (Texto)
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-[10px] uppercase text-slate-400 font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="px-1 py-3">Colaboradora</th>
                                            <th className="px-1 py-3">Condomínio</th>
                                            <th className="px-1 py-3 text-right text-slate-400 w-24">Salário</th>
                                            <th className="px-2 py-3 text-right">A Receber</th>
                                            <th className="px-1 py-3 text-center w-8 text-slate-400" title="Conta Confirmada">Conta</th>
                                            <th className={`px-1 py-3 text-center w-8 transition-colors ${allFuncsPago ? 'text-emerald-300' : 'text-slate-400'}`} title="Pagt. Feito">Pagt.</th>
                                            <th className="px-1 py-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sortedFuncs.map(renderFuncRow)}
                                    </tbody>
                                </table>
                            </div>

                            {/* Employee Payment Summary Footer */}
                            <div className="p-8 bg-slate-900/40 border-t border-slate-700 mt-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Pago</p>
                                            <h4 className="text-xl font-black text-white">{formatCurrency(employeePaymentStats.totalPaid)}</h4>
                                        </div>
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Total Pendente</p>
                                            <h4 className="text-xl font-black text-white">{formatCurrency(employeePaymentStats.totalPending)}</h4>
                                        </div>
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Colaboradores Pagos</p>
                                            <h4 className="text-lg font-black text-white">{employeePaymentStats.countPaid} <span className="text-slate-600 text-xs font-bold">/ {employeePaymentStats.totalCount}</span></h4>
                                        </div>
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Aguardando Pagamento</p>
                                            <h4 className="text-lg font-black text-amber-500">{employeePaymentStats.countUnpaid}</h4>
                                        </div>
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                    </div>
                    )}


                    {activeTab === 'rescisoes' && (
                        <div className="flex flex-col">
                            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-rose-500/10 px-5 py-2.5 rounded-xl border border-rose-500/30 shadow-lg shadow-rose-500/5">
                                        <span className="text-xs text-rose-500 uppercase font-black tracking-wider">Total Rescisões/Férias:</span>
                                        <span className="text-2xl font-black text-red-400">{formatCurrency(currentTotals.rescisoes)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-auto">
                                    <button
                                        onClick={() => setIsAddRescisaoModalOpen(true)}
                                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 shrink-0 flex items-center justify-center"
                                        title="Lançar Nova Rescisão ou Férias"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Colaborador</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Condomínio</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 w-44">Valor Rescisão/Férias</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 w-24">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {rescisoesFuncs.length > 0 ? (
                                            rescisoesFuncs.map((func) => (
                                                <tr key={func.originalIndex} className="hover:bg-slate-700/10 h-16 group">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={func.nome}
                                                            onChange={(e) => updateFunc(func.originalIndex, 'nome', e.target.value)}
                                                            className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-sm font-bold text-white mb-0.5"
                                                            placeholder="Nome"
                                                        />
                                                        <input
                                                            value={func.cargo || 'Rescisão/Férias'}
                                                            onChange={(e) => updateFunc(func.originalIndex, 'cargo', e.target.value)}
                                                            className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-[10px] text-slate-500 uppercase tracking-wider"
                                                            placeholder="Tipo (Ex: Rescisão)"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={func.condominio}
                                                            onChange={(e) => updateFunc(func.originalIndex, 'condominio', e.target.value)}
                                                            className="bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 bg-slate-900 text-xs text-slate-400 border border-slate-700 min-w-[120px]"
                                                            placeholder="Condomínio"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <CurrencyField
                                                            value={func.rescisaoFerias || 0}
                                                            onChange={(val) => updateFunc(func.originalIndex, 'rescisaoFerias', val)}
                                                            textColor="text-indigo-400"
                                                            width="w-36"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                onClick={() => updateFunc(func.originalIndex, 'pagamentoFeito', !func.pagamentoFeito)}
                                                                className={`w-5 h-5 rounded-full transition-all border-2 ${func.pagamentoFeito ? 'bg-indigo-500 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-700 hover:border-indigo-500/50'}`}
                                                            >
                                                                {func.pagamentoFeito && <Check className="w-3 h-3 text-white m-auto" />}
                                                            </button>
                                                            <button 
                                                                onClick={() => updateFunc(func.originalIndex, 'rescisaoFerias', 0)}
                                                                className="p-1.5 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-slate-900 rounded-full text-slate-700">
                                                            <Calendar className="w-10 h-10" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-bold text-slate-400">Nenhum lançamento efetuado</p>
                                                            <p className="text-sm text-slate-500 mt-1">Clique em "Lançar Nova" para adicionar rescisões ou férias.</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setIsAddRescisaoModalOpen(true)}
                                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                                        >
                                                            <Plus className="w-4 h-4" /> Começar Lançamento
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {rescisoesFuncs.length > 0 && (
                                        <tfoot className="bg-slate-900/40 border-t border-slate-700">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Soma das Rescisões/Férias</td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-lg font-black text-indigo-400">{formatCurrency(currentTotals.rescisoes)}</span>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impostos' && (
                        <div className="flex flex-col">
                            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-rose-500/10 px-5 py-2.5 rounded-xl border border-rose-500/30 shadow-lg shadow-rose-500/5">
                                        <span className="text-xs text-rose-500 uppercase font-black tracking-wider">Total Impostos:</span>
                                        <span className="text-2xl font-black text-red-400">{formatCurrency(currentTotals.impostos)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-auto">
                                    <button
                                        onClick={addImposto}
                                        className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 shrink-0 flex items-center justify-center"
                                        title="Adicionar Imposto"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Imposto / Obrigação</th>
                                            <th className="px-6 py-4">Vencimento</th>
                                            <th className={`px-2 py-4 text-center w-10 transition-colors ${allImpostosPago ? 'text-emerald-300' : 'text-slate-400'}`}>Pagt.</th>
                                            <th className="px-6 py-4 text-right">Valor Pago</th>
                                            <th className="px-1 py-4 text-center w-8"></th>
                                            <th className="px-6 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sortedImpostos?.map((imp) => (
                                            <tr key={imp.originalIndex} className="hover:bg-slate-700/10">
                                                <td className="px-6 py-3 text-white font-medium">
                                                    <input
                                                        value={imp.nome}
                                                        onChange={(e) => updateImposto(imp.originalIndex, 'nome', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 w-full"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        value={imp.vencimento || ''}
                                                        onChange={(e) => updateImposto(imp.originalIndex, 'vencimento', e.target.value)}
                                                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 w-full text-slate-400"
                                                    />
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => updateImposto(imp.originalIndex, 'pagamentoFeito', !imp.pagamentoFeito)}
                                                        className={`w-4 h-4 rounded-full transition-all mx-auto ${imp.pagamentoFeito ? 'bg-emerald-300 shadow-sm' : 'bg-slate-700/40'}`}
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <CurrencyField
                                        value={imp.valor || 0}
                                                        onChange={(val) => updateImposto(imp.originalIndex, 'valor', val)}
                                                        textColor="text-red-400"
                                                        width="w-32"
                                                    />
                                                </td>
                                                <td className="px-1 py-3 text-center">
                                                    <button
                                                        onClick={() => openNoteModal('tax', imp.originalIndex, imp.nome, imp.observacao || '')}
                                                        className={`p-1.5 rounded-lg transition-all ${imp.observacao ? 'text-amber-400 bg-amber-400/10 shadow-sm border border-amber-400/20' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
                                                        title="Observação"
                                                    >
                                                        <StickyNote className={`w-3.5 h-3.5 ${imp.observacao ? 'animate-pulse' : ''}`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button
                                                        onClick={() => removeImposto(imp.originalIndex)}
                                                        className="p-1 text-slate-600 hover:text-red-400 transition-colors"
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
                    {activeTab === 'gastos' && (
                        <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-red-500/10 px-5 py-2.5 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/5">
                                        <span className="text-xs text-red-500 uppercase font-black tracking-wider">Total de Gastos:</span>
                                        <span className="text-2xl font-black text-red-400">{formatCurrency(currentTotals.gastos)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-auto">
                                    <button
                                        onClick={() => handleOpenGastoModal()}
                                        className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 shrink-0 flex items-center justify-center"
                                        title="Novo Gasto"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Header de Resumo de Categorias */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-indigo-500/20 flex flex-col justify-center transition-all hover:bg-slate-900/60">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Pagamentos</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{formatCurrency(gastosByCategory.Pagamentos)}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-center transition-all hover:bg-slate-900/60">
                                        <div className="flex items-center gap-2 mb-1">
                                            <HandCoins className="w-3 h-3 text-amber-400" />
                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Vales</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{formatCurrency(gastosByCategory.Vales)}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-center transition-all hover:bg-slate-900/60">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Utensils className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Restaurantes</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{formatCurrency(gastosByCategory.Restaurantes)}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700 flex flex-col justify-center transition-all hover:bg-slate-900/60">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag className="w-3 h-3 text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outros</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{formatCurrency(gastosByCategory.Outros)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                     <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Detalhes dos Lançamentos</h2>
                                </div>

                            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/50 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-slate-700/50">
                                            <th className="px-6 py-4 w-16 text-center">Status</th>
                                            <th className="px-6 py-4">Descrição do Gasto</th>
                                            <th className="px-6 py-4 w-28">Dia</th>
                                            <th className="px-6 py-4">Categoria</th>
                                            <th className="px-6 py-4 text-right">Valor</th>
                                            <th className="px-6 py-4 w-16 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/20">
                                        {(localMonth.gastos || []).map((gasto, idx) => (
                                            <tr key={gasto.id || idx} className="group hover:bg-slate-700/20 transition-all">
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => updateGasto(idx, 'pago', !gasto.pago)}
                                                        className="transition-transform active:scale-90"
                                                    >
                                                        {gasto.pago ? (
                                                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-slate-900 border-2 border-slate-800 rounded-lg" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{gasto.descricao}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" /> Dia {gasto.data ? gasto.data.split('-')[2] : '--'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                        gasto.categoria === 'Pagamentos' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                        gasto.categoria === 'Vales' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        gasto.categoria === 'Restaurantes' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        'bg-slate-700 text-slate-400'
                                                    }`}>
                                                        {gasto.categoria || 'Outros'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-300">
                                                    {formatCurrency(gasto.valor || 0)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleOpenGastoModal(idx)}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeGasto(idx)}
                                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!localMonth.gastos || localMonth.gastos.length === 0) && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <DollarSign className="w-12 h-12 text-slate-500" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nenhum gasto registrado</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isAddCondoModalOpen}
                onClose={() => setIsAddCondoModalOpen(false)}
                title="Novo Condomínio no Mês"
            >
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome do Condomínio</label>
                        <input 
                            type="text" value={newCondoData.nome} 
                            onChange={e => setNewCondoData({...newCondoData, nome: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                            placeholder="Ex: Condomínio Solar"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Receita Bruta (R$)</label>
                            <input 
                                type="number" value={newCondoData.receitaBruta} 
                                onChange={e => setNewCondoData({...newCondoData, receitaBruta: parseFloat(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">INSS Retido (R$)</label>
                            <input 
                                type="number" value={newCondoData.inssRetido} 
                                onChange={e => setNewCondoData({...newCondoData, inssRetido: parseFloat(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Administradora</label>
                        <select 
                            value={newCondoData.administradora}
                            onChange={e => setNewCondoData({...newCondoData, administradora: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none appearance-none"
                        >
                            <option value="">Nenhuma / Direto</option>
                            {Object.keys(ADMIN_CONFIGS).map(admin => (
                                <option key={admin} value={admin}>{admin}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleSaveNewCondo}
                        className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-amber-600/20 transition-all mt-4"
                    >
                        Cadastrar Condomínio
                    </button>
                </div>
            </Modal>

            {/* Modal: Mass Import Employees */}
            <Modal
                isOpen={isMassImportModalOpen}
                onClose={() => setIsMassImportModalOpen(false)}
                title="Importar Dados de Funcionários (Texto)"
            >
                <div className="space-y-6">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Cole abaixo os blocos de texto dos funcionários seguindo o formato sugerido. 
                        O sistema irá buscar funcionários pelo nome e atualizar seus valores.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cole aqui o Texto</label>
                        <textarea 
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            className="w-full h-80 bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white outline-none font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-emerald-500/30 transition-all"
                            placeholder={"Zurami\nSalario base: R$2.500,00\n+ Extras: R$0,00\n- Faltas: R$0,00\n- Vales: R$0,00\n= LÍQUIDO: R$2.500,00\n\nPróximo Funcionário..."}
                        />
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                        <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Dica de Formato</h5>
                        <pre className="text-[9px] text-slate-400 leading-tight">
                            Nome do Funcionário{"\n"}
                            Salario base: R$ 2.500,00{"\n"}
                            + Extras: R$ 100,00{"\n"}
                            - Faltas: R$ 0,00{"\n"}
                            - Vales: R$ 50,00{"\n"}
                            {"\n"}
                            (Deixe uma linha em branco entre funcionários)
                        </pre>
                    </div>

                    <button 
                        onClick={handleMassImport}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-white/20" /> Processar e Importar
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isAddFuncModalOpen}
                onClose={() => setIsAddFuncModalOpen(false)}
                title="Novo Colaborador no Mês"
            >
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                        <input 
                            type="text" value={newFuncData.nome} 
                            onChange={e => setNewFuncData({...newFuncData, nome: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Condomínio Principal</label>
                        <input 
                            type="text" value={newFuncData.condominio} 
                            onChange={e => setNewFuncData({...newFuncData, condominio: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Salário Base (R$)</label>
                        <input 
                            type="number" value={newFuncData.salario} 
                            onChange={e => setNewFuncData({...newFuncData, salario: parseFloat(e.target.value) || 0})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none font-bold"
                        />
                    </div>
                    <button 
                        onClick={handleSaveNewFunc}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all"
                    >
                        Cadastrar Colaborador
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isAddImpModalOpen}
                onClose={() => setIsAddImpModalOpen(false)}
                title="Novo Imposto/Obrigação"
            >
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição</label>
                        <input 
                            type="text" value={newImpData.nome} 
                            onChange={e => setNewImpData({...newImpData, nome: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor (R$)</label>
                            <input 
                                type="number" value={newImpData.valor} 
                                onChange={e => setNewImpData({...newImpData, valor: parseFloat(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vencimento</label>
                            <input 
                                type="text" value={newImpData.vencimento} 
                                onChange={e => setNewImpData({...newImpData, vencimento: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                                placeholder="DD/MM"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveNewImp}
                        className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-amber-600/20 transition-all"
                    >
                        Cadastrar Imposto
                    </button>
                </div>
            </Modal>

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

            {/* Modal de Lançamento de Rescisão/Férias */}
            {/* Modal de Lançamento de Rescisão/Férias (Novo) */}
            <Modal
                isOpen={isAddRescisaoModalOpen}
                onClose={() => setIsAddRescisaoModalOpen(false)}
                title="Lançar Rescisão ou Férias"
            >
                <div className="space-y-6 p-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Colaborador</label>
                        <input 
                            type="text" 
                            placeholder="Nome completo" 
                            value={newRescisaoData.nome} 
                            onChange={e => setNewRescisaoData({...newRescisaoData, nome: e.target.value})} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                        <input 
                            type="text" 
                            placeholder="Nome do Condomínio" 
                            value={newRescisaoData.condominio} 
                            onChange={e => setNewRescisaoData({...newRescisaoData, condominio: e.target.value})} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button 
                                    onClick={() => setNewRescisaoData({...newRescisaoData, tipo: 'Rescisão'})}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newRescisaoData.tipo === 'Rescisão' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Rescisão
                                </button>
                                <button 
                                    onClick={() => setNewRescisaoData({...newRescisaoData, tipo: 'Férias'})}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newRescisaoData.tipo === 'Férias' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Férias
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00"
                                value={newRescisaoData.valor} 
                                onChange={e => setNewRescisaoData({...newRescisaoData, valor: parseFloat(e.target.value) || 0})} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveRescisao}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] mt-4"
                    >
                        Confirmar Lançamento
                    </button>
                </div>
            </Modal>


            {/* Modal de Lançamento de Gasto Business */}
            <Modal
                isOpen={isGastoModalOpen}
                onClose={() => setIsGastoModalOpen(false)}
                title={editingGastoIndex !== null ? "Editar Gasto" : "Novo Gasto Empresarial"}
            >
                <div className="space-y-6 p-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descrição do Gasto</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Refeição Equipe" 
                            value={gastoFormData.descricao} 
                            onChange={e => setGastoFormData({...gastoFormData, descricao: e.target.value})} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Dia</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="31"
                                placeholder="01"
                                value={gastoFormData.data ? gastoFormData.data.split('-')[2] : '01'} 
                                onChange={e => {
                                    const day = e.target.value.padStart(2, '0');
                                    const baseDate = gastoFormData.data || new Date().toISOString().split('T')[0];
                                    const dateParts = baseDate.split('-');
                                    setGastoFormData({...gastoFormData, data: `${dateParts[0]}-${dateParts[1]}-${day}`});
                                }} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00"
                                value={gastoFormData.valor} 
                                onChange={e => setGastoFormData({...gastoFormData, valor: Number(e.target.value)})} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block mb-2">Categoria</label>
                        <div className="grid grid-cols-2 gap-2">
                             {[
                                { id: 'Pagamentos', icon: <DollarSign className="w-3 h-3"/>, color: 'indigo' },
                                { id: 'Vales', icon: <HandCoins className="w-3 h-3"/>, color: 'amber' },
                                { id: 'Restaurantes', icon: <Utensils className="w-3 h-3"/>, color: 'emerald' },
                                { id: 'Outros', icon: <Tag className="w-3 h-3"/>, color: 'slate' }
                             ].map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => setGastoFormData({...gastoFormData, categoria: cat.id as any})} 
                                    className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        gastoFormData.categoria === cat.id 
                                        ? `bg-${cat.color}-600 border-${cat.color}-400 text-white shadow-lg` 
                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                                >
                                    {cat.icon} {cat.id}
                                </button>
                             ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveGasto} 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 text-white transition-all active:scale-[0.98] mt-4"
                    >
                        {editingGastoIndex !== null ? "Atualizar Lançamento" : "Confirmar Lançamento"}
                    </button>
                </div>
            </Modal>

            {/* Modal de Observação (Quadro) */}
            {noteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-amber-400">
                                <StickyNote className="w-5 h-5" />
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-300">
                                    Observação: <span className="text-white">{noteModal.title}</span>
                                </h3>
                            </div>
                            <button 
                                onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
                                className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={noteModal.value}
                                onChange={(e) => setNoteModal(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Digite aqui sua observação..."
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[150px] resize-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="px-6 py-4 bg-slate-800/30 flex justify-end gap-3">
                            <button 
                                onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveNoteModal}
                                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
                            >
                                Salvar Alteração
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Gerador de NF Completo */}
            <Modal
                isOpen={isFullNfGeneratorOpen}
                onClose={() => setIsFullNfGeneratorOpen(false)}
                title={`Gerador de Nota Fiscal - ${localMonth.monthName}`}
                maxWidth="6xl"
            >
                <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[80vh]">
                    <NFDraftGenerator
                        condominios={(localMonth.condominios || []).map(c => ({
                            id: c.id,
                            nome: c.nome,
                            cnpj: c.cnpj,
                            valorContrato: c.valorContrato || 0,
                            administradora: c.administradora
                        })) as any}
                        initialCondoId={fullNfGeneratorCondoName || undefined}
                        onUpdateSuccess={(newValue) => {
                            const condoIdx = (localMonth.condominios || []).findIndex(c => c.nome === fullNfGeneratorCondoName);
                            if (condoIdx !== -1) {
                                updateCondo(condoIdx, 'receitaBruta', newValue);
                            }
                        }}
                        initialMonth={(() => {
                            const monthsInPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                            const mName = localMonth.monthName.split(' ')[0];
                            const idx = monthsInPt.findIndex(m => m.toLowerCase() === mName.toLowerCase());
                            return idx + 1;
                        })()}
                        initialYear={(() => {
                            const year = parseInt(localMonth.monthName.split(' ')[1]) || new Date().getFullYear();
                            return year;
                        })()}
                    />
                </div>
            </Modal>

            {/* Modal Gerador de Holerites Completo */}
            <Modal
                isOpen={isFullPayrollGeneratorOpen}
                onClose={() => setIsFullPayrollGeneratorOpen(false)}
                title={`Gerador de Holerites - ${localMonth.monthName}`}
                maxWidth="6xl"
            >
                <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[80vh]">
                    <PaymentGeneratorView
                        employees={localMonth.funcionarios || []}
                        initialEmployeeId={fullPayrollGeneratorEmployeeId}
                        initialMonth={(() => {
                            const monthsInPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                            const mName = localMonth.monthName.split(' ')[0];
                            return monthsInPt.findIndex(m => m.toLowerCase() === mName.toLowerCase()) + 1;
                        })()}
                        initialYear={parseInt(localMonth.monthName.split(' ')[1]) || new Date().getFullYear()}
                    />
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

function SummaryCard({ title, value, color = "text-white", icon, subtitle }: { title: string, value: string | number, color?: string, icon?: React.ReactNode, subtitle?: string }) {
    const displayValue = typeof value === 'number' ? formatCurrency(value) : value;
    return (
        <div className="bg-slate-900 shadow-xl border border-slate-700/50 p-4 rounded-2xl flex flex-col gap-2 group hover:border-indigo-500/30 transition-all min-w-0">
            <div className="flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{title}</span>
                {icon && <div className={`${color} opacity-40 group-hover:opacity-100 transition-opacity shrink-0`}>{icon}</div>}
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden">
                <p className={`text-lg sm:text-xl font-black ${color} truncate`} title={displayValue.toString()}>{displayValue}</p>
                {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-80">{subtitle}</p>}
            </div>
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
                className={`flex items-center justify-end px-3 py-1.5 bg-slate-900/40 border border-transparent hover:border-slate-600 rounded-lg cursor-text transition-all ${textColor} font-mono font-bold ${width} text-xs tabular-nums text-right`}
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
