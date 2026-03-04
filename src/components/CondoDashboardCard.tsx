import { useState } from 'react';
import { Building2, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { CondominioData, FuncionarioData } from '../modelsFinance';

interface CondoDashboardCardProps {
    condo: CondominioData;
    employees: FuncionarioData[];
}

export function CondoDashboardCard({ condo, employees }: CondoDashboardCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:border-emerald-500/30 group ${isExpanded ? 'ring-2 ring-emerald-500/20 shadow-2xl scale-[1.02]' : 'hover:bg-slate-800 shadow-lg'}`}
        >
            {/* Header / Summary */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'} transition-colors`}>
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">{condo.nome}</h3>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider">{condo.cnpj}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">Valor Contrato</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(condo.valorContrato || 0)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-5 pt-2 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        {/* Contract Dates */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Detalhes do Contrato
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                                    <p className="text-[9px] text-slate-500 uppercase font-bold">Início</p>
                                    <p className="text-xs text-blue-400 font-medium">{condo.inicio || 'Não definido'}</p>
                                </div>
                                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                                    <p className="text-[9px] text-slate-500 uppercase font-bold">Término</p>
                                    <p className="text-xs text-emerald-400 font-medium">{condo.termino || 'Não definido'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Employee List */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Equipe Alocada ({employees.length})
                            </h4>
                            <div className="bg-slate-900/50 rounded-lg border border-slate-700/30 max-h-40 overflow-y-auto divide-y divide-slate-700/30">
                                {employees.length > 0 ? (
                                    employees.map((emp, i) => (
                                        <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                            <div>
                                                <p className="text-xs font-semibold text-white">{emp.nome}</p>
                                                <p className="text-[9px] text-slate-500">{emp.cargo || 'Funcionário'}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium">{formatCurrency(emp.salario || 0)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-[10px] text-slate-600">Nenhum funcionário vinculado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
