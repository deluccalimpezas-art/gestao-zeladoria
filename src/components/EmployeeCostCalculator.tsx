'use client'

import React, { useState, useMemo } from 'react';
import { 
    Calculator, 
    Settings2, 
    DollarSign, 
    ShieldCheck, 
    GraduationCap,
    PiggyBank,
    Info
} from 'lucide-react';

export function EmployeeCostCalculator() {
    const [salarioBruto, setSalarioBruto] = useState<number>(1500);
    
    // Percentuais editáveis
    const [percentuais, setPercentuais] = useState({
        inssEmpresa: 20,
        sat: 3,
        fgts: 8,
        salarioEducacao: 0,
        multaFGTS: 4,
        ferias: 11.11,
        decimoTerceiro: 8.33,
        fgtsSobre13: 0.67,
        inssSobre13: 2.12
    });

    const [showSettings, setShowSettings] = useState(false);

    const calculos = useMemo(() => {
        const calculateVal = (pct: number) => (salarioBruto * pct) / 100;

        const encargosDiretos = [
            { id: 'inss', label: 'INSS Empresa', pct: percentuais.inssEmpresa, value: calculateVal(percentuais.inssEmpresa) },
            { id: 'sat', label: 'SAT (Acidente Trabalho)', pct: percentuais.sat, value: calculateVal(percentuais.sat) },
            { id: 'fgts', label: 'FGTS Mensal', pct: percentuais.fgts, value: calculateVal(percentuais.fgts) },
            { id: 'educacao', label: 'Salário Educação', pct: percentuais.salarioEducacao, value: calculateVal(percentuais.salarioEducacao) },
        ];

        const provisoes = [
            { id: 'multa', label: 'Multa Provisória FGTS (40% diluído)', pct: percentuais.multaFGTS, value: calculateVal(percentuais.multaFGTS) },
            { id: 'ferias', label: 'Férias (1/12 + 1/3)', pct: percentuais.ferias, value: calculateVal(percentuais.ferias) },
            { id: '13', label: '13º Salário (1/12)', pct: percentuais.decimoTerceiro, value: calculateVal(percentuais.decimoTerceiro) },
            { id: 'fgts13', label: 'FGTS sobre 13º', pct: percentuais.fgtsSobre13, value: calculateVal(percentuais.fgtsSobre13) },
            { id: 'inss13', label: 'INSS sobre 13º', pct: percentuais.inssSobre13, value: calculateVal(percentuais.inssSobre13) },
        ];

        const totalEncargosValue = encargosDiretos.reduce((acc, curr) => acc + curr.value, 0) + 
                                  provisoes.reduce((acc, curr) => acc + curr.value, 0);
        
        const totalEncargosPct = percentuais.inssEmpresa + percentuais.sat + percentuais.fgts + 
                                percentuais.salarioEducacao + percentuais.multaFGTS + 
                                percentuais.ferias + percentuais.decimoTerceiro + 
                                percentuais.fgtsSobre13 + percentuais.inssSobre13;

        const valorMensalPagar = encargosDiretos.reduce((acc, curr) => acc + curr.value, 0);
        const valorMensalGuardar = provisoes.reduce((acc, curr) => acc + curr.value, 0);

        return {
            encargosDiretos,
            provisoes,
            totalEncargosValue,
            totalEncargosPct,
            valorMensalPagar,
            valorMensalGuardar,
            custoTotal: salarioBruto + totalEncargosValue
        };
    }, [salarioBruto, percentuais]);

    const formatBRL = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Main Input Card */}
                <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2rem] shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <DollarSign className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">Salário Bruto</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Base de cálculo mensal</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-3 rounded-xl transition-all ${showSettings ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-2xl">R$</div>
                        <input 
                            type="number"
                            value={salarioBruto}
                            onChange={(e) => setSalarioBruto(Number(e.target.value))}
                            className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-3xl py-6 pl-16 pr-8 text-3xl font-black text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
                            placeholder="0,00"
                        />
                    </div>

                    {showSettings && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-4">
                            {Object.entries(percentuais).map(([key, val]) => (
                                <div key={key} className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">
                                        {key === 'inssEmpresa' ? 'INSS Empresa' : 
                                         key === 'sat' ? 'SAT %' : 
                                         key === 'fgts' ? 'FGTS %' : 
                                         key === 'salarioEducacao' ? 'Salário Educação %' :
                                         key === 'multaFGTS' ? 'Multa FGTS (4%)' :
                                         key === 'ferias' ? 'Férias %' :
                                         key === 'decimoTerceiro' ? '13º %' :
                                         key === 'fgtsSobre13' ? 'FGTS s/ 13º' : 'INSS s/ 13º'}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={val}
                                            onChange={(e) => setPercentuais({...percentuais, [key]: Number(e.target.value)})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table Detail */}
                <div className="bg-slate-800/20 border border-slate-700/50 rounded-[2rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/40 border-b border-slate-700/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">%</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            <tr className="bg-indigo-500/5 italic">
                                <td className="px-6 py-4 text-sm text-slate-300 font-bold">Salário Base</td>
                                <td className="px-6 py-4 text-sm text-slate-500 text-center font-bold">-</td>
                                <td className="px-6 py-4 text-sm text-indigo-400 text-right font-black">{formatBRL(salarioBruto)}</td>
                            </tr>
                            {[...calculos.encargosDiretos, ...calculos.provisoes].map((item) => (
                                <tr key={item.id} className="hover:bg-slate-700/10 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-400 font-medium">{item.label}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500 text-center font-bold">{item.pct.toFixed(2)}%</td>
                                    <td className="px-6 py-4 text-sm text-white text-right font-black">{formatBRL(item.value)}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-800/40">
                                <td className="px-6 py-4 text-sm text-white font-black">Total de Encargos</td>
                                <td className="px-6 py-4 text-sm text-indigo-400 text-center font-black">{calculos.totalEncargosPct.toFixed(2)}%</td>
                                <td className="px-6 py-4 text-sm text-indigo-400 text-right font-black">{formatBRL(calculos.totalEncargosValue)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Summary */}
            <div className="space-y-6">
                <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-2xl shadow-indigo-500/20 space-y-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <Calculator className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10 space-y-1">
                        <h3 className="text-white/70 text-[10px] font-black uppercase tracking-widest">Custo Total /Mês</h3>
                        <div className="text-4xl font-black text-white">{formatBRL(calculos.custoTotal)}</div>
                    </div>
                    <div className="relative z-10 p-4 bg-white/10 rounded-2xl border border-white/10">
                        <div className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Encargos Totais</div>
                        <div className="text-xl font-black text-white">+{calculos.totalEncargosPct.toFixed(2)}% <span className="text-xs font-medium text-white/60">sobre o bruto</span></div>
                    </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2rem] shadow-xl space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mt-1">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">A Pagar no Mês</h4>
                                <p className="text-2xl font-black text-emerald-400">{formatBRL(calculos.valorMensalPagar)}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Guias, FGTS e SAT</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 mt-1">
                                <PiggyBank className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">A Provisionar</h4>
                                <p className="text-2xl font-black text-amber-400">{formatBRL(calculos.valorMensalGuardar)}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Férias, 13º e reserva</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700/50">
                        <div className="flex items-start gap-3 text-slate-500 italic leading-relaxed">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] font-medium">Este cálculo considera um funcionário em regime de Lucro Presumido/Real. Para Simples Nacional, os encargos podem ser menores conforme o anexo.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
