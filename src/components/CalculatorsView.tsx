'use client'

import React, { useState } from 'react';
import { 
    Calculator, 
    UserPlus, 
    UserMinus, 
    ChevronLeft,
    TrendingUp,
    FileText,
    ArrowRight
} from 'lucide-react';
import { EmployeeCostCalculator } from './EmployeeCostCalculator';
import { ResignationCalculator } from './ResignationCalculator';

type CalcType = 'menu' | 'cost' | 'resignation';

export function CalculatorsView() {
    const [view, setView] = useState<CalcType>('menu');

    if (view === 'cost') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                    onClick={() => setView('menu')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Voltar ao Menu</span>
                </button>
                <EmployeeCostCalculator />
            </div>
        );
    }

    if (view === 'resignation') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                    onClick={() => setView('menu')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Voltar ao Menu</span>
                </button>
                <ResignationCalculator />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 mb-4">
                    <Calculator className="w-10 h-10 text-indigo-400" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">Cálculos Trabalhistas</h1>
                <p className="text-slate-400 max-w-lg mx-auto font-medium">
                    Simule os custos de contratação e os valores de rescisão de forma precisa e rápida.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Option 1: Employee Cost */}
                <button 
                    onClick={() => setView('cost')}
                    className="group relative bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2rem] text-left hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all shadow-2xl overflow-hidden active:scale-95"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <UserPlus className="w-32 h-32 text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            <UserPlus className="w-8 h-8 text-indigo-400 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Custo Funcionário</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Calcule o custo total mensal (encargos + provisões) para a empresa no Brasil.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest pt-4">
                            <span>Simular agora</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </button>

                {/* Option 2: Resignation */}
                <button 
                    onClick={() => setView('resignation')}
                    className="group relative bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2rem] text-left hover:border-rose-500/50 hover:bg-slate-800/60 transition-all shadow-2xl overflow-hidden active:scale-95"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <UserMinus className="w-32 h-32 text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <UserMinus className="w-8 h-8 text-rose-400 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Custo Rescisão</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Simule os valores devidos no encerramento de um contrato de trabalho.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest pt-4">
                            <span>Calcular agora</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex items-start gap-4 max-w-2xl mx-auto mt-12">
                <TrendingUp className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-500/70 font-medium leading-relaxed">
                    <strong>Atenção:</strong> Estes cálculos são simulações baseadas em regras padrões. Valores reais podem variar de acordo com o sindicato, convenções coletivas e benefícios específicos.
                </p>
            </div>
        </div>
    );
}
