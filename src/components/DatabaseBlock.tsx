'use client'

import React, { useState } from 'react';
import { 
    Plus, 
    MoreHorizontal, 
    Search, 
    Filter, 
    ArrowUpDown, 
    Settings, 
    Calendar, 
    CheckSquare, 
    Type, 
    Hash,
    ChevronDown,
    Database
} from 'lucide-react';

interface Column {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox';
}

interface Row {
    id: string;
    [key: string]: any;
}

export function DatabaseBlock() {
    const [columns, setColumns] = useState<Column[]>([
        { id: 'c1', name: 'Nome', type: 'text' },
        { id: 'c2', name: 'Valor', type: 'number' },
        { id: 'c3', name: 'Status', type: 'checkbox' },
    ]);

    const [rows, setRows] = useState<Row[]>([
        { id: '1', c1: 'Projeto Alpha', c2: 1500, c3: true },
        { id: '2', c1: 'Contratação Zelador', c2: 4200, c3: false },
    ]);

    const handleAddRow = () => {
        const newRow: Row = { id: crypto.randomUUID() };
        columns.forEach(col => {
            newRow[col.id] = col.type === 'checkbox' ? false : col.type === 'number' ? 0 : '';
        });
        setRows([...rows, newRow]);
    };

    const handleAddColumn = () => {
        const newCol: Column = { id: crypto.randomUUID(), name: 'Nova Coluna', type: 'text' };
        setColumns([...columns, newCol]);
    };

    const updateValue = (rowId: string, colId: string, value: any) => {
        setRows(rows.map(r => r.id === rowId ? { ...r, [colId]: value } : r));
    };

    return (
        <div className="my-8 bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-500">
            {/* Table Header / Controls */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Database className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-300">Banco de Dados de Teste</h4>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all">
                        <Filter className="w-3.5 h-3.5" /> Filtrar
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all">
                        <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar
                    </button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Grid/Table View */}
            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/10">
                            {columns.map(col => (
                                <th key={col.id} className="group px-4 py-3 font-black text-slate-500 uppercase tracking-widest border-r border-slate-700/30 last:border-r-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {col.type === 'text' && <Type className="w-3 h-3" />}
                                            {col.type === 'number' && <Hash className="w-3 h-3" />}
                                            {col.type === 'checkbox' && <CheckSquare className="w-3 h-3" />}
                                            {col.name}
                                        </div>
                                        <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                    </div>
                                </th>
                            ))}
                            <th className="w-12 px-4 py-3">
                                <button onClick={handleAddColumn} className="p-1 hover:bg-slate-700 rounded text-slate-500 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {rows.map(row => (
                            <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                {columns.map(col => (
                                    <td key={col.id} className="px-4 py-2 border-r border-slate-700/20 last:border-r-0">
                                        {col.type === 'checkbox' ? (
                                            <div className="flex justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={row[col.id]} 
                                                    onChange={(e) => updateValue(row.id, col.id, e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600 relative after:content-['✓'] after:absolute after:text-[8px] after:text-white after:font-black after:inset-0 after:flex after:items-center after:justify-center after:opacity-0 checked:after:opacity-100"
                                                />
                                            </div>
                                        ) : (
                                            <input 
                                                value={row[col.id]}
                                                onChange={(e) => updateValue(row.id, col.id, col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                                className="w-full bg-transparent border-none outline-none text-slate-300 placeholder-slate-700"
                                                placeholder="..."
                                            />
                                        )}
                                    </td>
                                ))}
                                <td className="w-12 px-4 py-2"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Add Row */}
            <div className="p-2 border-t border-slate-700/30">
                <button 
                    onClick={handleAddRow}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-200 hover:bg-slate-700/30 rounded-xl transition-all group"
                >
                    <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Novo Item
                </button>
            </div>
        </div>
    );
}


