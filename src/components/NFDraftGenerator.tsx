import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Copy, Check, Briefcase, Mail, DollarSign, ChevronDown, Calendar } from 'lucide-react';
import { CondominioData } from '@/modelsFinance';
import { MONTHS, getHolidays } from '@/lib/holidayUtils';
import { getMonthlyFinanceByMonth, updateMonthlyCondominio } from '../../app/actions';

interface NFDraftGeneratorProps {
    condominios: CondominioData[];
    initialCondoId?: string;
    initialMonth?: number;
    initialYear?: number;
}

const ADMIN_EMAILS: Record<string, string> = {
    'UP': 'contato@upcondominios.com',
    'VIBRA': 'financeiro@vibracondominios.com.br',
    'VIP': 'contato@vipscondominios.com.br',
    'JN': 'adm01@jncondominios.com.br',
    'REM': 'financeiro1@rmcontabilidadesc.com.br',
    'RM': 'financeiro1@rmcontabilidadesc.com.br',
};

const getAdminEmail = (administradora?: string): string | null => {
    if (!administradora) return null;
    const upper = administradora.trim().toUpperCase();
    for (const [key, email] of Object.entries(ADMIN_EMAILS)) {
        if (upper.includes(key)) return email;
    }
    return null;
};

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value).replace(/\s/g, '');

const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return cnpj;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const NFDraftGenerator: React.FC<NFDraftGeneratorProps> = ({ 
    condominios, 
    initialCondoId = '', 
    initialMonth = new Date().getMonth() + 1,
    initialYear = new Date().getFullYear()
}) => {
    const [selectedCondoId, setSelectedCondoId] = useState<string>(initialCondoId);
    const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
    const [selectedYear, setSelectedYear] = useState<number>(initialYear);

    const holidays = getHolidays(selectedMonth, selectedYear);

    // NF values
    const [valorBruto, setValorBruto] = useState<number>(0);
    const [editingBruto, setEditingBruto] = useState(false);
    const [tempBruto, setTempBruto] = useState('');

    // Copy states
    const [copiedDesc, setCopiedDesc] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedSubject, setCopiedSubject] = useState(false);
    const [copiedCnpj, setCopiedCnpj] = useState(false);
    const [copiedEmailBody, setCopiedEmailBody] = useState(false);
    const [copiedFileName, setCopiedFileName] = useState(false);
    const [showHolidays, setShowHolidays] = useState(false);
    const [monthlyRecordId, setMonthlyRecordId] = useState<string | null>(null);
    const [isSavingSync, setIsSavingSync] = useState(false);
    const [lastSyncedValue, setLastSyncedValue] = useState<number | null>(null);

    const RETENCAO_RATE = 0.11;
    const retencao = valorBruto * RETENCAO_RATE;
    const valorLiquido = valorBruto - retencao;

    const currentCondo = condominios.find(c => c.nome === selectedCondoId);
    const adminEmail = getAdminEmail(currentCondo?.administradora);
    const mesVigencia = `${MONTHS[selectedMonth - 1]} de ${selectedYear}`;
    const mesVigenciaCurto = MONTHS[selectedMonth - 1];

    // The service month is always the previous month (NF is issued after the service month)
    const refMonthIdx = selectedMonth === 1 ? 11 : selectedMonth - 2;
    const refYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const mesReferenciaCurto = MONTHS[refMonthIdx];
    const mesReferencia = `${mesReferenciaCurto} de ${refYear}`;

    // Sync with monthly finance spreadsheet
    useEffect(() => {
        if (!currentCondo) {
            setValorBruto(0);
            setMonthlyRecordId(null);
            setLastSyncedValue(null);
            return;
        }

        const fetchMonthlyData = async () => {
            const monthName = `${mesReferenciaCurto} ${refYear}`;
            console.log(`Buscando dados mensais para: ${monthName} (Condo: ${currentCondo.nome})`);
            
            const result = await getMonthlyFinanceByMonth(monthName);
            if (result.success && result.data) {
                const monthlyCondo = (result.data as any).condominios.find((mc: any) => 
                    mc.condominioId === currentCondo.id || mc.nome === currentCondo.nome
                );
                
                if (monthlyCondo) {
                    console.log(`Registro mensal encontrado! Valor: ${monthlyCondo.valorCobrado}`);
                    setValorBruto(monthlyCondo.valorCobrado);
                    setMonthlyRecordId(monthlyCondo.id);
                    setLastSyncedValue(monthlyCondo.valorCobrado);
                } else {
                    console.log("Condomínio não encontrado neste mês financeiro. Usando valor base.");
                    setValorBruto(currentCondo.receitaBruta || currentCondo.valorContrato || 0);
                    setMonthlyRecordId(null);
                    setLastSyncedValue(null);
                }
            } else {
                console.log("Mês financeiro não encontrado ou erro. Usando valor base.");
                setValorBruto(currentCondo.receitaBruta || currentCondo.valorContrato || 0);
                setMonthlyRecordId(null);
                setLastSyncedValue(null);
            }
        };

        fetchMonthlyData();
    }, [selectedCondoId, currentCondo, mesReferenciaCurto, refYear]);

    const handleSaveToFinance = async () => {
        if (!monthlyRecordId) return;
        
        setIsSavingSync(true);
        try {
            const result = await updateMonthlyCondominio(monthlyRecordId, { 
                valorCobrado: valorBruto 
            });
            if (result.success) {
                setLastSyncedValue(valorBruto);
                alert('Valor atualizado na planilha financeira com sucesso!');
            } else {
                alert('Erro ao atualizar planilha: ' + result.error);
            }
        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
        } finally {
            setIsSavingSync(false);
        }
    };

    const nfDescription = currentCondo
        ? `Referente à prestação de serviços de zeladoria e manutenção no ${currentCondo.nome} durante o mês de ${mesReferencia}.`
        : '';

    const emailSubject = currentCondo
        ? `Nota Fiscal ${currentCondo.nome} ${mesReferenciaCurto}`
        : '';

    const emailBody = currentCondo
        ? `Bom dia, espero que esteja bem!\n\nEm anexo, envio a Nota Fiscal referente aos serviços de zeladoria do ${currentCondo.nome} do mês de ${mesReferenciaCurto}.\n\nCaso tenha alguma dúvida ou precise de mais informações, estou à disposição para ajudar.\n\nAtenciosamente,\nDeLucca Gestão em Limpeza`
        : '';

    const suggestedFileName = currentCondo 
        ? `NFe ${currentCondo.nome} ${mesReferencia.replace(' de ', ' ').toLowerCase()}` 
        : '';

    const copyText = useCallback((text: string, setter: (v: boolean) => void) => {
        navigator.clipboard.writeText(text).then(() => {
            setter(true);
            setTimeout(() => setter(false), 2000);
        });
    }, []);

    const CopyButton = ({ text, copied, onCopy, label }: { text: string, copied: boolean, onCopy: () => void, label?: string }) => (
        <button
            onClick={onCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'}`}
        >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-sky-400" />
                            Gerador de NF
                        </div>

                        {/* Holidays Popover */}
                        {holidays.length > 0 && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowHolidays(!showHolidays)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-lg shrink-0 ${showHolidays ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{holidays.length} Feriados</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showHolidays ? 'rotate-180' : ''}`} />
                                </button>

                                {showHolidays && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowHolidays(false)} />
                                        <div className="absolute top-full mt-2 left-0 z-20 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl min-w-[240px] animate-in zoom-in-95 fade-in duration-200">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Feriados {MONTHS[selectedMonth-1]}
                                            </p>
                                            <div className="space-y-3">
                                                {holidays.map((h, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="bg-amber-500 text-slate-950 font-black text-[11px] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                                            {h.day}
                                                        </div>
                                                        <span className="text-xs text-slate-200 font-bold uppercase tracking-tight">{h.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </h1>
                    {currentCondo && (
                        <div className="mt-2 flex flex-col gap-2">
                            <span className="text-lg font-bold text-slate-200">{currentCondo.nome}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-base font-black font-mono text-sky-400 bg-sky-400/10 px-3 py-1 rounded-lg border border-sky-400/30 shadow-lg shadow-sky-400/10">
                                    {formatCNPJ(currentCondo.cnpj)}
                                </span>
                                <CopyButton 
                                    text={formatCNPJ(currentCondo.cnpj)} 
                                    copied={copiedCnpj} 
                                    onCopy={() => copyText(formatCNPJ(currentCondo.cnpj), setCopiedCnpj)}
                                    label="Copiar CNPJ"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Condo Selector */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none min-w-[200px]"
                            value={selectedCondoId}
                            onChange={(e) => setSelectedCondoId(e.target.value)}
                        >
                            <option value="">Selecione o condomínio</option>
                            {condominios.map(c => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Month Selector */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {currentCondo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Summary & Values */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:border-slate-600/50 transition-all">
                            <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-sky-400" />
                                <h3 className="font-black text-white text-xs uppercase tracking-widest">Informações da NF</h3>
                            </div>
                            
                            <div className="divide-y divide-slate-700/30">
                                <div className="flex items-center justify-between px-5 py-3">
                                    <span className="text-sm text-slate-400">Valor Bruto</span>
                                    <div className="flex items-center gap-2">
                                        {editingBruto ? (
                                            <input
                                                type="text"
                                                value={tempBruto}
                                                onChange={(e) => setTempBruto(e.target.value)}
                                                onBlur={() => {
                                                    setValorBruto(parseCurrency(tempBruto));
                                                    setEditingBruto(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setValorBruto(parseCurrency(tempBruto));
                                                        setEditingBruto(false);
                                                    }
                                                }}
                                                className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-white w-32 focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span 
                                                className="font-black text-white hover:text-indigo-400 cursor-pointer transition-colors border-b border-white/10 hover:border-indigo-400/30"
                                                onClick={() => {
                                                    setTempBruto(valorBruto.toFixed(2).replace('.', ','));
                                                    setEditingBruto(true);
                                                }}
                                            >
                                                {formatCurrency(valorBruto)}
                                            </span>
                                        )}

                                        {/* Sync status and save button */}
                                        {monthlyRecordId && (
                                            <div className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                                {lastSyncedValue === valorBruto ? (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                        Sincronizado
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleSaveToFinance}
                                                        disabled={isSavingSync}
                                                        className="flex items-center gap-2 text-[10px] text-amber-400 hover:text-amber-300 font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                                    >
                                                        {isSavingSync ? 'Salvando...' : (
                                                            <>
                                                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                                Salvar na Planilha
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-5 py-3">
                                    <span className="text-sm text-slate-400">Retenção INSS (11%)</span>
                                    <span className="font-bold text-rose-400">{formatCurrency(retencao)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Suggested Filename - Now between cards */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-lg shadow-amber-500/5 flex items-center justify-between group hover:border-amber-500/40 transition-all">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest italic flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Sugestão: Nome do Arquivo NF
                                </label>
                                <div className="text-sm text-white font-mono font-bold">
                                    {suggestedFileName}
                                </div>
                            </div>
                            <CopyButton 
                                text={suggestedFileName} 
                                copied={copiedFileName} 
                                onCopy={() => copyText(suggestedFileName, setCopiedFileName)}
                                label="Copiar Nome"
                            />
                        </div>

                        {/* Email Card */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:border-slate-600/50 transition-all">
                            <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-sky-400" />
                                    <h3 className="font-black text-white text-xs uppercase tracking-widest">Dados do E-mail</h3>
                                </div>
                            </div>
                            
                            <div className="p-5 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Destinatário</label>
                                        {adminEmail && (
                                            <CopyButton 
                                                text={adminEmail} 
                                                copied={copiedEmail} 
                                                onCopy={() => copyText(adminEmail, setCopiedEmail)}
                                                label="Copiar"
                                            />
                                        )}
                                    </div>
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono break-all">
                                        {adminEmail || 'E-mail não encontrado'}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Assunto</label>
                                        <CopyButton 
                                            text={emailSubject} 
                                            copied={copiedSubject} 
                                            onCopy={() => copyText(emailSubject, setCopiedSubject)}
                                            label="Copiar"
                                        />
                                    </div>
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm text-white">
                                        {emailSubject}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Description Preview */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:border-slate-600/50 transition-all h-full flex flex-col">
                            <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-sky-400" />
                                    <h3 className="font-black text-white text-xs uppercase tracking-widest">Informativo da NF</h3>
                                </div>
                                <CopyButton 
                                    text={nfDescription} 
                                    copied={copiedDesc} 
                                    onCopy={() => copyText(nfDescription, setCopiedDesc)}
                                    label="Copiar"
                                />
                            </div>
                            
                            <div className="p-6 flex-1">
                                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-slate-300 leading-relaxed text-sm h-full italic">
                                    "{nfDescription}"
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Corpo do E-mail Sugerido</h4>
                                    <CopyButton 
                                        text={emailBody} 
                                        copied={copiedEmailBody} 
                                        onCopy={() => copyText(emailBody, setCopiedEmailBody)}
                                        label="Copiar Texto"
                                    />
                                </div>
                                <div className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">
                                    {emailBody}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-[2rem] p-20 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
                        <Briefcase className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest mb-2">Aguardando Seleção</h3>
                    <p className="text-slate-500 text-sm">Selecione um condomínio acima para visualizar os dados da Nota Fiscal.</p>
                </div>
            )}
        </div>
    );
};

export default NFDraftGenerator;
