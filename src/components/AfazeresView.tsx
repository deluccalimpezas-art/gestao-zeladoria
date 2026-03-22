'use client'

import { useState, useEffect } from 'react';
import { 
    Plus, 
    CheckCircle2, 
    Circle, 
    Trash2, 
    StickyNote,
    History,
    RefreshCw,
    X
} from 'lucide-react';
import { getTaskTodos, upsertTaskTodo, deleteTaskTodo } from '../../app/actions';

export function AfazeresView() {
    const [todos, setTodos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        setIsLoading(true);
        const data = await getTaskTodos();
        setTodos(data);
        setIsLoading(false);
    };

    const handleAddTodo = async () => {
        if (!newTitle.trim()) return;
        setIsLoading(true);
        const res = await upsertTaskTodo({ title: newTitle, description: newDesc });
        if (res.success) {
            setNewTitle('');
            setNewDesc('');
            setShowForm(false);
            await loadTodos();
        }
        setIsLoading(false);
    };

    const handleToggleComplete = async (todo: any) => {
        setIsLoading(true);
        await upsertTaskTodo({ ...todo, completed: !todo.completed });
        await loadTodos();
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        setIsLoading(true);
        await deleteTaskTodo(id);
        await loadTodos();
        setIsLoading(false);
    };

    const pending = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Add Action */}
            <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-amber-400" />
                        Quadro de Afazeres
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Gerencie suas tarefas rápidas e lembretes com visual de post-it.
                    </p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4" /> Nova Tarefa
                    </button>
                )}
            </div>

            {/* Form Modal/Section */}
            {showForm && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200 max-w-xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                         <button onClick={() => setShowForm(false)} className="p-1 text-amber-800/50 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                         </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-amber-800">
                        <Plus className="w-6 h-6" />
                        <h3 className="text-lg font-black uppercase tracking-tight">Novo Post-it</h3>
                    </div>
                    <div className="space-y-4">
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="O que precisa ser feito?"
                            className="w-full bg-white/50 border-b-2 border-amber-200 p-3 text-lg font-bold text-amber-900 placeholder:text-amber-700/30 focus:outline-none focus:border-amber-500 transition-colors bg-transparent"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                        <textarea 
                            placeholder="Adicione uma descrição (opcional)..."
                            rows={3}
                            className="w-full bg-white/50 border-2 border-amber-200 rounded-xl p-3 text-sm text-amber-900 placeholder:text-amber-700/30 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={handleAddTodo}
                                disabled={!newTitle.trim() || isLoading}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                {isLoading ? 'Criando...' : 'ADICIONAR TAREFA'}
                            </button>
                            <button 
                                onClick={() => setShowForm(false)}
                                className="px-6 bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold rounded-xl transition-all"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Tasks Grid */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">Tarefas Pendentes ({pending.length})</span>
                    <div className="h-px bg-slate-700 flex-1"></div>
                </div>
                
                {pending.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl">
                        <StickyNote className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Nenhuma tarefa pendente.</p>
                        <p className="text-xs">Tudo limpo por aqui!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pending.map(todo => (
                            <div 
                                key={todo.id} 
                                className="bg-amber-100 hover:bg-amber-50 border-b-4 border-amber-300 rounded-tl-lg rounded-tr-3xl rounded-br-lg rounded-bl-3xl p-6 shadow-lg shadow-amber-900/10 transition-all hover:-translate-y-1 hover:shadow-xl relative group flex flex-col min-h-[180px]"
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleDelete(todo.id)}
                                        className="p-1.5 text-amber-800/30 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-amber-900 text-xl leading-tight mb-3 pr-6">{todo.title}</h3>
                                    {todo.description && (
                                        <p className="text-sm text-amber-800/70 border-t border-amber-200/50 pt-3 leading-relaxed">
                                            {todo.description}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleToggleComplete(todo)}
                                    className="mt-6 w-full py-2 bg-amber-800/10 hover:bg-emerald-500 hover:text-white border-2 border-amber-800/20 hover:border-emerald-600 text-amber-900 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all group/btn"
                                >
                                    <Circle className="w-4 h-4 group-hover/btn:hidden" />
                                    <CheckCircle2 className="w-4 h-4 hidden group-hover/btn:block" />
                                    CONCLUIR TAREFA
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Tasks History */}
            {completed.length > 0 && (
                <div className="space-y-4 pt-10">
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-slate-700 flex-1"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 flex items-center gap-2 bg-slate-900 py-1 rounded-full border border-slate-700">
                           <History className="w-3 h-3 text-indigo-400" /> Histórico de Concluídas ({completed.length})
                        </span>
                        <div className="h-px bg-slate-700 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {completed.map(todo => (
                            <div 
                                key={todo.id} 
                                className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between group grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
                            >
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300 line-through decoration-indigo-500/50 pr-6">{todo.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1">Concluída em {new Date(todo.updatedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <button 
                                        onClick={() => handleToggleComplete(todo)}
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Reabrir
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(todo.id)}
                                        className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
