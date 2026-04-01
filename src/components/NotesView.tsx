'use client'

import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Maximize2, X, Save, StickyNote } from 'lucide-react';
import { saveNote, deleteNote } from '../../app/actions';
import { useRouter } from 'next/navigation';

interface Note {
    id: string;
    title: string;
    content: string | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface NotesViewProps {
    initialNotes: any[];
}

const COLORS = [
    { name: 'Slate', bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-200' },
    { name: 'Blue', bg: 'bg-blue-900/40', border: 'border-blue-500/50', text: 'text-blue-200' },
    { name: 'Emerald', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', text: 'text-emerald-200' },
    { name: 'Amber', bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-200' },
    { name: 'Rose', bg: 'bg-rose-900/40', border: 'border-rose-500/50', text: 'text-rose-200' },
    { name: 'Indigo', bg: 'bg-indigo-900/40', border: 'border-indigo-500/50', text: 'text-indigo-200' },
];

export function NotesView({ initialNotes }: NotesViewProps) {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [search, setSearch] = useState('');
    const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const filteredNotes = useMemo(() => {
        return notes.filter(n => 
            n.title.toLowerCase().includes(search.toLowerCase()) || 
            (n.content && n.content.toLowerCase().includes(search.toLowerCase()))
        );
    }, [notes, search]);

    const handleSave = async () => {
        if (!editingNote || !editingNote.title?.trim()) return;
        setIsSaving(true);
        const res = await saveNote({
            id: editingNote.id,
            title: editingNote.title,
            content: editingNote.content || '',
            color: editingNote.color || 'slate'
        });
        setIsSaving(false);
        if (res.success) {
            setEditingNote(null);
            router.refresh();
            // In a real app we might want to update local state or re-fetch
            // For now, router.refresh() will update initialNotes on next load if this was a server component parent
            // But since we are in a client component, we should probably update local state too
            if (res.data) {
                const saved = res.data as Note;
                setNotes(prev => {
                    const exists = prev.find(n => n.id === saved.id);
                    if (exists) return prev.map(n => n.id === saved.id ? saved : n);
                    return [saved, ...prev];
                });
            }
        } else {
            alert("Erro ao salvar nota: " + res.error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Excluir esta nota?")) return;
        const res = await deleteNote(id);
        if (res.success) {
            setNotes(prev => prev.filter(n => n.id !== id));
            router.refresh();
        } else {
            alert("Erro ao deletar nota: " + res.error);
        }
    };

    const handleCreate = () => {
        setEditingNote({
            title: '',
            content: '',
            color: 'slate'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <StickyNote className="w-8 h-8 text-indigo-400" />
                    Minhas Notas
                </h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar notas..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
                        />
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Nota
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => {
                        const colorScheme = COLORS.find(c => c.name.toLowerCase() === (note.color?.toLowerCase() || 'slate')) || COLORS[0];
                        return (
                            <div 
                                key={note.id}
                                onClick={() => setEditingNote(note)}
                                className={`${colorScheme.bg} border ${colorScheme.border} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden h-48 flex flex-col`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-lg ${colorScheme.text} truncate pr-8`}>{note.title}</h3>
                                    <button 
                                        onClick={(e) => handleDelete(note.id, e)}
                                        className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-slate-400 text-sm line-clamp-4 flex-1 overflow-hidden whitespace-pre-wrap">
                                    {note.content || <span className="italic opacity-50">Sem conteúdo...</span>}
                                </p>
                                <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                    <span>{new Date(note.updatedAt).toLocaleDateString('pt-BR')}</span>
                                    <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                        <StickyNote className="w-12 h-12 mb-4 opacity-20" />
                        <p>Nenhuma nota encontrada.</p>
                        <button onClick={handleCreate} className="mt-4 text-indigo-400 font-bold hover:text-indigo-300">Começar a escrever</button>
                    </div>
                )}
            </div>

            {/* Modal de Edição */}
            {editingNote && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex gap-2">
                                {COLORS.map(c => (
                                    <button 
                                        key={c.name}
                                        onClick={() => setEditingNote(prev => ({ ...prev, color: c.name.toLowerCase() }))}
                                        className={`w-6 h-6 rounded-full border-2 ${editingNote.color === c.name.toLowerCase() ? 'border-white' : 'border-transparent'} ${c.bg}`}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={() => setEditingNote(null)}
                                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <input 
                                type="text"
                                placeholder="Título da nota..."
                                value={editingNote.title || ''}
                                onChange={e => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white placeholder:opacity-30"
                                autoFocus
                                spellCheck={false}
                            />
                            <textarea 
                                placeholder="Comece a escrever aqui..."
                                value={editingNote.content || ''}
                                onChange={e => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                                className="w-full bg-transparent border-none outline-none text-slate-300 placeholder:opacity-20 flex-1 min-h-[300px] resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        <div className="p-6 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-500 italic">
                                {editingNote.updatedAt ? `Última alteração: ${new Date(editingNote.updatedAt).toLocaleString('pt-BR')}` : 'Nova nota'}
                            </span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setEditingNote(null)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving || !editingNote.title?.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Salvando...' : 'Salvar Nota'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
