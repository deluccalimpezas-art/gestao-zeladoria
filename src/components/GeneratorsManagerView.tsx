'use client'

import React, { useState } from 'react';
import { 
    Zap, 
    PenTool, 
    Receipt, 
    Wallet, 
    Calculator, 
    ChevronLeft,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { ContractGeneratorView } from './ContractGeneratorView';
import NFDraftGenerator from './NFDraftGenerator';
import { ProposalGeneratorView } from './ProposalGeneratorView';


type GeneratorType = 'menu' | 'contracts' | 'proposals';

interface GeneratorsManagerViewProps {
    employees: any[];
    condominios: any[];
}

export function GeneratorsManagerView({ employees, condominios }: GeneratorsManagerViewProps) {
    const [view, setView] = useState<GeneratorType>('menu');

    const renderBackButton = () => (
        <button 
            onClick={() => setView('menu')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-6 px-2"
        >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">Voltar aos Geradores</span>
        </button>
    );

    if (view === 'contracts') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderBackButton()}
                <ContractGeneratorView />
            </div>
        );
    }




    if (view === 'proposals') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderBackButton()}
                <ProposalGeneratorView />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
            <div className="text-center pt-8">
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">Geradores</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Orçamentos */}
                <button 
                    onClick={() => setView('proposals')}
                    className="group relative bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] text-left hover:border-amber-500/50 hover:bg-slate-800/60 transition-all shadow-xl active:scale-95"
                >
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Sparkles className="w-6 h-6 text-amber-400 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white mb-1">Propostas</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                Gerar propostas comerciais profissionais.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-widest pt-2">
                            <span>Abrir</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </button>

                {/* 2. Contratos */}
                <button 
                    onClick={() => setView('contracts')}
                    className="group relative bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] text-left hover:border-rose-500/50 hover:bg-slate-800/60 transition-all shadow-xl active:scale-95"
                >
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <PenTool className="w-6 h-6 text-rose-400 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white mb-1">Contratos</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                Gerar documentos de admissão e demissão.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest pt-2">
                            <span>Abrir</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </button>



            </div>
        </div>
    );
}
