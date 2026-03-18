import React, { useState, useEffect } from 'react';
import { FileText, Copy, AlertCircle, Calendar, Check, Briefcase } from 'lucide-react';
import { CondominioData } from '@/modelsFinance';

interface NFDraftGeneratorProps {
    condominios: CondominioData[];
}

interface Feriado {
    date: string;
    name: string;
    type: string;
}

const NFDraftGenerator: React.FC<NFDraftGeneratorProps> = ({ condominios }) => {
    const [selectedCondoId, setSelectedCondoId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [feriados, setFeriados] = useState<Feriado[]>([]);
    const [customDescription, setCustomDescription] = useState<string>('');
    const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
    const [copied, setCopied] = useState(false);

    const monthsRaw = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const currentCondo = condominios.find(c => c.nome === selectedCondoId);

    useEffect(() => {
        const fetchFeriados = async () => {
            setIsLoadingHolidays(true);
            try {
                // Fetching from Brasil API
                const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${selectedYear}`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar feriados');
                }
                const data: Feriado[] = await response.json();
                
                // Filter holidays for the selected month
                const monthHolidays = data.filter(feriado => {
                    const dateObj = new Date(feriado.date);
                    // getUTCMonth is used because dates from API might be UTC and we want to match the numeric month exactly
                    return dateObj.getUTCMonth() + 1 === selectedMonth;
                });
                
                setFeriados(monthHolidays);
            } catch (error) {
                console.error('Erro ao carregar feriados:', error);
                setFeriados([]);
            } finally {
                setIsLoadingHolidays(false);
            }
        };

        fetchFeriados();
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        // Auto-generate description when condo or month changes
        if (currentCondo) {
            const defaultText = `Referente à prestação de serviços de zeladoria e manutenção no ${currentCondo.nome} durante o mês de ${monthsRaw[selectedMonth - 1]} de ${selectedYear}.`;
            setCustomDescription(defaultText);
        } else {
            setCustomDescription('Selecione um condomínio para gerar o rascunho base.');
        }
        setCopied(false);
    }, [selectedCondoId, selectedMonth, selectedYear, currentCondo]);

    const handleCopy = () => {
        navigator.clipboard.writeText(customDescription).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
            <header className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-amber-400" />
                        Gerador de Nota Fiscal
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Configure o rascunho da sua NF antes de emitir no sistema oficial.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Painel de Configuração (Esquerda) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-400" />
                            Configurações
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Condomínio</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={selectedCondoId}
                                    onChange={(e) => setSelectedCondoId(e.target.value)}
                                >
                                    <option value="">Selecione um Condomínio...</option>
                                    {condominios.map((c) => (
                                        <option key={c.nome} value={c.nome}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Mês de Ref.</label>
                                    <select 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {monthsRaw.map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Ano</label>
                                    <select 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    >
                                        {[2024, 2025, 2026, 2027, 2028].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alertas sobre Feriados */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            Feriados no Mês
                        </h2>
                        
                        {isLoadingHolidays ? (
                            <div className="space-y-2">
                                <div className="h-10 bg-slate-700/50 rounded-lg animate-pulse"></div>
                                <div className="h-10 bg-slate-700/50 rounded-lg animate-pulse w-3/4"></div>
                            </div>
                        ) : feriados.length > 0 ? (
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {feriados.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-white font-medium block">{f.name}</span>
                                            <span className="text-slate-400 text-xs">{formatDate(f.date)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2 text-emerald-400">
                                <Check className="w-4 h-4 shrink-0" />
                                <span className="text-sm">Nenhum feriado nacional neste mês.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Painel do Rascunho (Direita) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full flex flex-col hover:border-slate-600 transition-colors">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                Descrição da Nota Fiscal
                            </h2>
                            <button 
                                onClick={handleCopy}
                                disabled={!currentCondo}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-95 ${
                                    copied 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                        : 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                                }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copiado para a área de transferência!' : 'Copiar Texto para Nota'}
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col group relative h-full min-h-[300px]">
                            <textarea
                                className="w-full h-full absolute inset-0 bg-slate-900 border border-slate-700 rounded-xl p-5 text-white text-base resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono leading-relaxed outline-none"
                                value={customDescription}
                                onChange={(e) => setCustomDescription(e.target.value)}
                                placeholder="Selecione um condomínio ou digite a descrição da nota aqui..."
                                disabled={!currentCondo}
                            />
                            {!currentCondo && (
                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-xl backdrop-blur-sm z-10">
                                    <div className="bg-slate-800 text-slate-300 px-6 py-4 rounded-xl border border-slate-700 shadow-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                                        <div className="p-3 bg-slate-700/50 rounded-full">
                                            <FileText className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium">Selecione o condomínio primeiro</p>
                                        <p className="text-sm text-slate-500 text-center max-w-[250px]">
                                            Para gerar o rascunho automático da nota fiscal, escolha um condomínio no painel lateral.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500/70" />
                            <p>
                                <strong className="text-slate-400 font-medium">Atenção:</strong> Revise as informações de feriados listados e adicione eventuais extras (como horas adicionais em feriados) antes de copiar este texto para o emissor oficial da sua prefeitura.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NFDraftGenerator;
