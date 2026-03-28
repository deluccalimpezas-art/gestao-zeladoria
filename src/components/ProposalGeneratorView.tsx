'use client'

import React, { useState, useRef } from 'react';
import { PenTool, Printer, Building2, MapPin, Edit3, RotateCcw, Sparkles } from 'lucide-react';

export function ProposalGeneratorView() {
    const [clientName, setClientName] = useState('Cond. Summer Ville');
    const [clientAddress, setClientAddress] = useState('Itapema/SC');
    const [monthlyValue, setMonthlyValue] = useState('6.200,00');
    
    // Manual Edit Mode
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualHtml, setManualHtml] = useState('');
    const editableRef = useRef<HTMLDivElement>(null);

    const toggleManualMode = () => {
        if (!isManualMode) {
            const el = document.getElementById('proposal-content-area');
            if (el) {
                setManualHtml(el.innerHTML);
                setIsManualMode(true);
            }
        } else {
            if (window.confirm("Sair do modo de edição manual irá descartar suas alterações personalizadas e voltar ao modelo automático. Deseja continuar?")) {
                setIsManualMode(false);
            }
        }
    };

    const handleManualChange = () => {
        if (editableRef.current) {
            setManualHtml(editableRef.current.innerHTML);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = ""; 
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        Gerador de Orçamentos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere propostas comerciais profissionais em PDF.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleManualMode}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                            isManualMode 
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500/20' 
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {isManualMode ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isManualMode ? 'Voltar p/ Automático' : 'Habilitar Edição Livre'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95 translate-y-0"
                    >
                        <Printer className="w-4 h-4" />
                        IMPRIMIR / PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Inputs */}
                <div className="lg:col-span-4 space-y-6 no-print">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6">
                        <h2 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-400" />
                            Dados do Cliente
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Condomínio</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all font-medium"
                                        placeholder="Ex: Cond. Summer Ville"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Endereço/Cidade</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text"
                                        value={clientAddress}
                                        onChange={(e) => setClientAddress(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all font-medium"
                                        placeholder="Ex: Itapema/SC"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-slate-700">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Valor Mensal (R$)</label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                    <input 
                                        type="text"
                                        value={monthlyValue}
                                        onChange={(e) => setMonthlyValue(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all font-medium"
                                        placeholder="6.200,00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 italic text-sm text-amber-200/80 leading-relaxed shadow-lg">
                        "O orçamento é a primeira impressão da nossa qualidade. Certifique-se de que os valores estão corretos antes de imprimir."
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-8 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 no-print-bg">
                    <div 
                        id="printable-proposal"
                        className="bg-white text-black p-[15mm] min-h-[297mm] shadow-inner font-serif leading-[1.6] print-shadow-none"
                        style={{ width: '210mm', margin: '0 auto' }}
                    >
                        {isManualMode ? (
                            <div 
                                ref={editableRef}
                                contentEditable
                                onInput={handleManualChange}
                                className="outline-none focus:ring-2 focus:ring-amber-500/20 rounded min-h-[200mm]"
                                dangerouslySetInnerHTML={{ __html: manualHtml }}
                            />
                        ) : (
                            <div id="proposal-content-area" className="flex flex-col space-y-6 text-sm">
                                {/* Letterhead */}
                                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-baseline gap-0 transform scale-100 origin-left">
                                            <span className="text-3xl font-black text-[#FFD700] tracking-tighter font-serif">De</span>
                                            <span className="text-3xl font-black text-[#00CEE4] tracking-tighter font-sans">Lucca</span>
                                        </div>
                                        <div className="text-[14px] text-[#00CEE4] -mt-2 italic font-serif">
                                            Gestão em Limpeza
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-widest">
                                        <p>Eduardo Gabriel Lucca</p>
                                        <p>CNPJ: 49.909.068/0001-87</p>
                                        <p>Itapema - Santa Catarina</p>
                                    </div>
                                </div>

                                <h1 className="text-xl font-bold text-center uppercase tracking-widest border-y border-slate-200 py-4 mb-8">
                                    PROPOSTA DE PRESTAÇÃO DE SERVIÇOS
                                </h1>

                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-lg border border-slate-100 mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Informações do Cliente</p>
                                        <p className="font-bold text-slate-900">Nome: {clientName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Localidade</p>
                                        <p className="font-bold text-slate-900">Endereço: {clientAddress}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Descrição do Serviço</h3>
                                    <p className="text-justify text-slate-700">
                                        Estamos nos propondo a auxiliar nas responsabilidades de zeladoria do seu condomínio, assumindo atribuições que englobam a supervisão das áreas comuns, a manutenção e controle da limpeza, bem como o acompanhamento e a fiscalização da execução dos serviços, assegurando um ambiente seguro, organizado e adequadamente conservado para todos os moradores.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Proposta Comercial</h3>
                                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <p className="font-bold text-slate-900 italic underline">A) Uma Auxiliar de Limpeza: 44 horas semanais.</p>
                                                <div className="text-xs text-slate-600 space-y-1 ml-4">
                                                    <p className="font-bold text-slate-800">Segunda à sexta-feira:</p>
                                                    <p>Período Integral (08:00 às 12:00, 13:00 às 17:00)</p>
                                                    <p className="font-bold text-slate-800 pt-1">Sábado:</p>
                                                    <p>Período Matutino (08:00 às 12:00)</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Investimento Mensal</p>
                                                <p className="text-2xl font-black text-slate-900">R$ {monthlyValue}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Condições Comerciais</h3>
                                    <ul className="text-xs space-y-3 text-slate-700 list-disc ml-4">
                                        <li>O pagamento deverá ser realizado mensalmente, mediante emissão de Nota Fiscal, com vencimento todo dia 05.</li>
                                        <li>O prazo contratual será de 12 meses, com renovação automática, salvo manifestação contrária com 30 dias de antecedência.</li>
                                        <li>Em caso de rescisão imotivada antes do término do contrato, será aplicada multa equivalente a 01 (uma) mensalidade vigente à época.</li>
                                        <li>Os valores poderão ser reajustados anualmente conforme convenção coletiva da categoria ou índice oficial de inflação.</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 p-4 border-l-4 border-amber-400 text-xs italic text-slate-700 mt-4 rounded-r-lg">
                                    <span className="font-bold block mb-1">Observação:</span>
                                    Este orçamento contempla apenas a prestação de serviços, não incluindo materiais de limpeza ou equipamentos.
                                </div>

                                <div className="space-y-2 pt-6">
                                    <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Validade da Proposta</h3>
                                    <p className="text-sm font-bold text-slate-800">Esta proposta possui validade de 15 (quinze) dias.</p>
                                </div>

                                <div className="pt-12 text-center space-y-4">
                                    <p className="text-slate-600 italic">Ficamos à disposição para discutir mais detalhes e ajustar a proposta de acordo com suas necessidades.</p>
                                    <div className="pt-8">
                                        <p className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-1">Atenciosamente</p>
                                        <p className="text-lg font-black text-slate-900 italic">DeLucca Gestão em Limpeza</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Ensure parent containers do not hide overflow or clip the print */
                    body, html, #root, main, div {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    #printable-proposal, #printable-proposal * {
                        visibility: visible;
                    }
                    #printable-proposal {
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 0;
                        margin: 0 !important;
                        padding: 15mm !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
                .no-print-bg {
                    background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
}
