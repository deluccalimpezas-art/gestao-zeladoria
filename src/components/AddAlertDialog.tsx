import React, { useState } from 'react';
import type { Alert, AlertType } from '../types';

interface AddAlertDialogProps {
    onSave: (alert: Omit<Alert, 'id'>) => void;
    onCancel: () => void;
}

export function AddAlertDialog({ onSave, onCancel }: AddAlertDialogProps) {
    const [type, setType] = useState<AlertType>('tarefa');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            type,
            title,
            subtitle,
            description,
            deadline
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Alerta</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AlertType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="tarefa">Tarefa / Destaque</option>
                    <option value="ferias">Férias / Ausência</option>
                    <option value="contrato">Contrato / RH</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Título</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Amanda Silva (RH)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subtítulo (Curto)</label>
                <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Em 30 dias"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Prazo / Data</label>
                <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="Ex: Dia 12/04"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Detalhes sobre a tarefa ou alerta..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium"
                >
                    Salvar Alerta
                </button>
            </div>
        </form>
    );
}
