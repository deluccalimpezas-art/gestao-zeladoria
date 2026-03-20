'use client'

import React, { useState, useMemo } from 'react';
import { 
    UserMinus, 
    Calendar, 
    Clock, 
    PiggyBank, 
    ArrowRightLeft,
    AlertCircle,
    Info
} from 'lucide-react';

export function ResignationCalculator() {
    const [inputs, setInputs] = useState({
        salario: 2500,
        mesesTrabalhados: 1,
        diasTrabalhados: 8,
        fgtsDepositado: 0,
        avisoPrevio: 0,
        isAvisoIndenizado: true
    });

    const calculos = useMemo(() => {
        const { salario, mesesTrabalhados, diasTrabalhados, fgtsDepositado, avisoPrevio, isAvisoIndenizado } = inputs;

        // 1. Saldo de Salário
        const saldoSalario = (salario / 30) * diasTrabalhados;

        // 2. Férias Proporcionais + 1/3
        const feriasProp = (salario * mesesTrabalhados) / 12;
        const feriasTerco = feriasProp / 3;
        const totalFerias = feriasProp + feriasTerco;

        // 3. 13º Salário Proporcional
        const decimoTerceiro = (salario * mesesTrabalhados) / 12;

        // 4. Aviso Prévio (se indenizado usa o valor do campo ou salário)
        const valorAviso = isAvisoIndenizado ? (avisoPrevio || salario) : 0;

        // 5. Multa FGTS (40%)
        // Se o usuário não informou o FGTS depositado, calculamos o aproximado (8% mensais)
        const fgtsBase = fgtsDepositado || (salario * 0.08 * mesesTrabalhados);
        const multaFGTS = fgtsBase * 0.40;

        const totalRescisao = saldoSalario + totalFerias + decimoTerceiro + valorAviso + multaFGTS;

        return {
            saldoSalario,
            feriasProp,
            feriasTerco,
            totalFerias,
            decimoTerceiro,
            valorAviso,
            multaFGTS,
            fgtsBase,
            totalRescisao
        };
    }, [inputs]);

    const formatBRL = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inputs Column */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                            <Clock className="w-5 h-5 text-rose-400" />
                        </div>
                        <h2 className="text-lg font-black text-white">Dados da Rescisão</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Salário Bruto</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">R$</span>
                                <input 
                                    type="number"
                                    value={inputs.salario}
                                    onChange={e => setInputs({...inputs, salario: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm text-white font-bold focus:outline-none focus:border-rose-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Meses Trab.</label>
                                <input 
                                    type="number"
                                    value={inputs.mesesTrabalhados}
                                    onChange={e => setInputs({...inputs, mesesTrabalhados: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-sm text-white font-bold focus:outline-none focus:border-rose-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Dias Trab. (Mês)</label>
                                <input 
                                    type="number"
                                    value={inputs.diasTrabalhados}
                                    onChange={e => setInputs({...inputs, diasTrabalhados: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-sm text-white font-bold focus:outline-none focus:border-rose-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">FGTS Já Depositado</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">R$</span>
                                <input 
                                    type="number"
                                    value={inputs.fgtsDepositado}
                                    onChange={e => setInputs({...inputs, fgtsDepositado: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm text-white font-bold focus:outline-none focus:border-rose-500 transition-all"
                                    placeholder="Deixe 0 para cálculo aprox."
                                />
                            </div>
                            <p className="text-[9px] text-slate-600 italic px-1">Se 0, calculamos 8% x meses</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aviso Prévio</label>
                                <button 
                                    onClick={() => setInputs({...inputs, isAvisoIndenizado: !inputs.isAvisoIndenizado})}
                                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${inputs.isAvisoIndenizado ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}
                                >
                                    {inputs.isAvisoIndenizado ? 'Indenizado' : 'Trabalhado'}
                                </button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">R$</span>
                                <input 
                                    type="number"
                                    value={inputs.avisoPrevio}
                                    disabled={!inputs.isAvisoIndenizado}
                                    onChange={e => setInputs({...inputs, avisoPrevio: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm text-white font-bold focus:outline-none focus:border-rose-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    placeholder={inputs.isAvisoIndenizado ? "Deixe 0 p/ salário cheio" : "N/A"}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-[2rem] flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed">
                        Este simulador considera **Demissão sem Justa Causa**. Pedidos de demissão ou justa causa removem o direito ao aviso indenizado e à multa de 40%.
                    </p>
                </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white">Detalhamento da Rescisão</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Valores brutos aproximados</p>
                        </div>
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                            <UserMinus className="w-7 h-7 text-rose-400" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Result Items */}
                        <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 font-black text-xs">1</div>
                                <span className="text-sm font-bold text-slate-300">Saldo de Salário ({inputs.diasTrabalhados} dias)</span>
                            </div>
                            <span className="text-sm font-black text-white">{formatBRL(calculos.saldoSalario)}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 font-black text-xs">2</div>
                                <div>
                                    <span className="text-sm font-bold text-slate-300 block">Férias Proporcionais + 1/3</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{inputs.mesesTrabalhados}/12 avos</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-white block">{formatBRL(calculos.totalFerias)}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Extra 1/3: {formatBRL(calculos.feriasTerco)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 font-black text-xs">3</div>
                                <span className="text-sm font-bold text-slate-300 block">13º Salário Proporcional</span>
                            </div>
                            <span className="text-sm font-black text-white">{formatBRL(calculos.decimoTerceiro)}</span>
                        </div>

                        <div className={`flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 transition-all ${inputs.isAvisoIndenizado ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 font-black text-xs">4</div>
                                <span className="text-sm font-bold text-slate-300 block">Aviso Prévio Indenizado</span>
                            </div>
                            <span className="text-sm font-black text-white">{formatBRL(calculos.valorAviso)}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400 font-black text-xs">5</div>
                                <div>
                                    <span className="text-sm font-bold text-rose-300 block">Multa 40% FGTS</span>
                                    <span className="text-[10px] text-rose-500/60 font-medium uppercase">Base: {formatBRL(calculos.fgtsBase)}</span>
                                </div>
                            </div>
                            <span className="text-sm font-black text-rose-400">{formatBRL(calculos.multaFGTS)}</span>
                        </div>
                    </div>

                    <div className="mt-12 bg-rose-600 p-8 rounded-[2rem] shadow-2xl shadow-rose-900/40 flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-500 group-hover:scale-105 transition-transform"></div>
                        <div className="relative z-10">
                            <h4 className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Total da Rescisão</h4>
                            <div className="text-4xl font-black text-white tracking-tight">{formatBRL(calculos.totalRescisao)}</div>
                        </div>
                        <div className="relative z-10 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                            <PiggyBank className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                        <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 font-medium italic">
                            Importante: Descontos de INSS, IRPF e eventuais adiantamentos/faltas não foram deduzidos deste cálculo bruto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
