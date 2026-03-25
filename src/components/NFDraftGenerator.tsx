import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Copy, Check, Briefcase, Mail, DollarSign, ChevronDown } from 'lucide-react';
import { CondominioData } from '@/modelsFinance';

interface NFDraftGeneratorProps {
    condominios: CondominioData[];
}

const ADMIN_EMAILS: Record<string, string> = {
    'UP': 'contato@upcondominios.com',
    'VIBRA': 'financeiro@vibracondominios.com.br',
    'VIP': 'contato@vipscondominios.com.br',
    'JN': 'financeiro@jncondominios.com.br',
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

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const NFDraftGenerator: React.FC<NFDraftGeneratorProps> = ({ condominios }) => {
    const [selectedCondoId, setSelectedCondoId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear] = useState<number>(new Date().getFullYear());

    // NF values
    const [valorBruto, setValorBruto] = useState<number>(0);
    const [editingBruto, setEditingBruto] = useState(false);
    const [tempBruto, setTempBruto] = useState('');

    // Copy states
    const [copiedDesc, setCopiedDesc] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedSubject, setCopiedSubject] = useState(false);

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

    // Auto-fill values from condo
    useEffect(() => {
        if (currentCondo) {
            const valorBase = currentCondo.receitaBruta || currentCondo.valorContrato || 0;
            setValorBruto(valorBase);
        } else {
            setValorBruto(0);
        }
    }, [selectedCondoId, currentCondo]);

    const nfDescription = currentCondo
        ? `Referente à prestação de serviços de zeladoria e manutenção no ${currentCondo.nome} durante o mês de ${mesReferencia}.`
        : '';

    const emailSubject = currentCondo
        ? `Nota Fiscal ${currentCondo.nome} ${mesReferenciaCurto}`
        : '';

    const emailBody = currentCondo
        ? `Bom dia, espero que esteja bem!\n\nEm anexo, envio a Nota Fiscal referente aos serviços de zeladoria do ${currentCondo.nome} do mês de ${mesReferenciaCurto}.\n\nCaso tenha alguma dúvida ou precise de mais informações, estou à disposição para ajudar.\n\nAtenciosamente,\nDeLucca Gestão em Limpeza`
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
            disabled={!currentCondo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
        >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {label || (copied ? 'Copiado!' : 'Copiar')}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header + Selectors */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-amber-400" />
                        Gerador de Nota Fiscal
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Selecione o condomínio e o mês para gerar a NF e o e-mail automaticamente.</p>
                </div>

                {/* Selectors */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none min-w-[220px]"
                            value={selectedCondoId}
                            onChange={(e) => setSelectedCondoId(e.target.value)}
                        >
                            <option value="">Selecione o Condomínio...</option>
                            {condominios.map((c) => (
                                <option key={c.nome} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
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

            {/* Two panels */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* === PAINEL 1: NOTA FISCAL === */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/30 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-bold text-white">Nota Fiscal</h2>
                        {currentCondo && <span className="ml-auto text-xs text-slate-500 font-medium">{currentCondo.nome} · {mesVigenciaCurto}</span>}
                    </div>

                    <div className="p-6 space-y-5 flex-1 flex flex-col">
                        {/* Valores */}
                        <div className="bg-slate-900/60 rounded-xl border border-slate-700 divide-y divide-slate-700/50">
                            {/* Valor Bruto */}
                            <div className="flex items-center justify-between px-5 py-3">
                                <span className="text-sm text-slate-400">Valor Bruto</span>
                                {editingBruto ? (
                                    <div className="flex items-center gap-2 bg-slate-800 border border-indigo-500 rounded-lg px-3 py-1.5">
                                        <span className="text-slate-500 text-xs">R$</span>
                                        <input
                                            autoFocus
                                            type="number"
                                            step="0.01"
                                            value={tempBruto}
                                            onChange={(e) => setTempBruto(e.target.value)}
                                            onBlur={() => { setValorBruto(parseFloat(tempBruto) || 0); setEditingBruto(false); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { setValorBruto(parseFloat(tempBruto) || 0); setEditingBruto(false); } }}
                                            className="bg-transparent border-none outline-none text-white font-bold text-sm w-28 text-right"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setTempBruto(valorBruto.toString()); setEditingBruto(true); }}
                                        className="font-bold text-white hover:text-amber-300 transition-colors cursor-text"
                                        title="Clique para editar"
                                    >
                                        {formatCurrency(valorBruto)}
                                    </button>
                                )}
                            </div>
                            {/* Retenção */}
                            <div className="flex items-center justify-between px-5 py-3">
                                <span className="text-sm text-slate-400">Retenção INSS <span className="text-xs text-slate-600">(11%)</span></span>
                                <span className="font-bold text-red-400">− {formatCurrency(retencao)}</span>
                            </div>
                            {/* Líquido */}
                            <div className="flex items-center justify-between px-5 py-3 bg-emerald-500/5 rounded-b-xl">
                                <span className="text-sm font-bold text-slate-300">Valor Líquido</span>
                                <span className="font-black text-emerald-400 text-lg">{formatCurrency(valorLiquido)}</span>
                            </div>
                        </div>

                        {/* Descrição da NF */}
                        <div className="flex-1 flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição da Nota</span>
                                <CopyButton
                                    text={nfDescription}
                                    copied={copiedDesc}
                                    onCopy={() => copyText(nfDescription, setCopiedDesc)}
                                />
                            </div>
                            <div className="relative flex-1 min-h-[120px]">
                                <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 font-mono leading-relaxed min-h-[120px]">
                                    {nfDescription || <span className="text-slate-600 italic">Selecione um condomínio para gerar a descrição...</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === PAINEL 2: E-MAIL === */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/30 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">E-mail para Administradora</h2>
                        {currentCondo && adminEmail && <span className="ml-auto text-xs text-slate-500 font-medium">{currentCondo.administradora}</span>}
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                        {/* Assunto */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assunto</span>
                                <CopyButton
                                    text={emailSubject}
                                    copied={copiedSubject}
                                    onCopy={() => copyText(emailSubject, setCopiedSubject)}
                                />
                            </div>
                            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-medium">
                                {emailSubject || <span className="text-slate-600 italic">Selecione um condomínio...</span>}
                            </div>
                        </div>

                        {/* E-mail destinatário */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Para</span>
                            {adminEmail ? (
                                <button
                                    onClick={() => copyText(adminEmail, setCopiedEmail)}
                                    className={`w-full flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all border font-mono ${copiedEmail ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-300 bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'}`}
                                >
                                    {copiedEmail ? <Check className="w-4 h-4 shrink-0" /> : <Mail className="w-4 h-4 shrink-0" />}
                                    <span className="truncate">{adminEmail}</span>
                                    {!copiedEmail && <Copy className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50" />}
                                </button>
                            ) : (
                                <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-600 italic">
                                    {currentCondo ? 'E-mail não cadastrado para esta administradora.' : 'Selecione um condomínio...'}
                                </div>
                            )}
                        </div>

                        {/* Corpo do e-mail */}
                        <div className="flex-1 flex flex-col space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem</span>
                                <CopyButton
                                    text={emailBody}
                                    copied={copiedEmail && false}
                                    onCopy={() => copyText(emailBody, () => {})}
                                    label="Copiar Mensagem"
                                />
                            </div>
                            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-line min-h-[200px]">
                                {emailBody || <span className="text-slate-600 italic">Selecione um condomínio para gerar o e-mail...</span>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NFDraftGenerator;
