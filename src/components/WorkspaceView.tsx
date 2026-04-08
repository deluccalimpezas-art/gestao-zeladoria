'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Plus, 
    Search, 
    MoreHorizontal, 
    ChevronRight, 
    ChevronDown, 
    FileText, 
    Layout, 
    Database, 
    Clock, 
    Star, 
    Settings, 
    Trash2, 
    Share2, 
    Sparkles,
    Type,
    CheckSquare,
    Loader2,
    Palette
} from 'lucide-react';
import { 
    getWorkspacePages, 
    getPageWithBlocks, 
    createWorkspacePage, 
    updateWorkspacePage, 
    deleteWorkspacePage,
    saveWorkspaceBlocks
} from '@/app/workspaceActions';
import { DatabaseBlock } from './DatabaseBlock';

interface Block {
    id: string;
    type: string;
    content: any;
    order?: number;
}

interface Page {
    id: string;
    title: string;
    icon?: string;
    cover?: string;
    blocks?: Block[];
    subPages?: Page[];
}

interface DocumentCardProps {
    page: Page;
    onClick: () => void;
}

interface DocumentEditorProps {
    page: Page;
    onUpdate: (title: string) => void;
    onUpdateBlock: (id: string, content: any) => void;
}

export function WorkspaceView() {
    const [pages, setPages] = useState<Page[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [activePage, setActivePage] = useState<Page | null>(null);
    const [loadingPages, setLoadingPages] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'tarefas' | 'cronograma' | 'documentos'>('tarefas');
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashSearch, setSlashSearch] = useState('');

    // Refs for debouncing
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loadPages = async () => {
        setLoadingPages(true);
        const res = await getWorkspacePages();
        if (res.success) {
            setPages(res.data || []);
            if (res.data && res.data.length > 0 && !activePageId) {
                setActivePageId(res.data[0].id);
            }
        }
        setLoadingPages(false);
    };

    const loadActivePage = async (id: string) => {
        setLoadingContent(true);
        const res = await getPageWithBlocks(id);
        if (res.success) {
            setActivePage(res.data);
            setSelectedDocId(null); // Reset when changing projects
        }
        setLoadingContent(false);
    };

    useEffect(() => {
        loadPages();
    }, []);

    useEffect(() => {
        if (activePageId) {
            loadActivePage(activePageId);
        }
    }, [activePageId]);

    const handleAddPage = async () => {
        const res = await createWorkspacePage("Novo Projeto");
        if (res.success) {
            setPages(prev => [...prev, res.data]);
            setActivePageId(res.data.id);
        }
    };

    const handleAddDocument = async () => {
        if (!activePage) return;
        const res = await createWorkspacePage("Documento sem título", activePage.id);
        if (res.success) {
             // Refresh active page to show new doc in grid
             loadActivePage(activePage.id);
        }
    };

    const handleUpdateTitle = async (newTitle: string) => {
        if (!activePage) return;
        const updated = { ...activePage, title: newTitle };
        setActivePage(updated);
        
        // Debounce database update
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            await updateWorkspacePage(activePage.id, { title: newTitle });
            setPages(prev => prev.map(p => p.id === activePage.id ? { ...p, title: newTitle } : p));
            setIsSaving(false);
        }, 1000);
    };

    const handleAddBlock = () => {
        if (!activePage) return;
        const newBlock = { id: crypto.randomUUID(), type: 'text', content: { text: '' }, order: activePage.blocks?.length || 0 };
        const updatedPage = { ...activePage, blocks: [...(activePage.blocks || []), newBlock] };
        setActivePage(updatedPage);
        triggerSaveBlocks(updatedPage.id, updatedPage.blocks || []);
    };

    const updateBlockContent = (blockId: string, newContent: any) => {
        if (!activePage) return;
        const updatedBlocks = (activePage.blocks || []).map(b => 
            b.id === blockId ? { ...b, content: newContent } : b
        );
        const updatedPage = { ...activePage, blocks: updatedBlocks };
        setActivePage(updatedPage);
        triggerSaveBlocks(updatedPage.id, updatedBlocks);
    };

    const handleCreateBlock = (type: string) => {
        if (!activePage) return;
        const newBlock = { 
            id: crypto.randomUUID(), 
            type, 
            content: type === 'todo' ? { text: '', checked: false } : { text: '' }, 
            order: activePage.blocks?.length || 0 
        };
        const updatedPage = { ...activePage, blocks: [...(activePage.blocks || []), newBlock] };
        setActivePage(updatedPage);
        triggerSaveBlocks(updatedPage.id, updatedPage.blocks || []);
        setShowSlashMenu(false);
        const input = document.getElementById('commandInput') as HTMLInputElement;
        if (input) input.value = '';
    };

    const triggerSaveBlocks = (pageId: string, blocks: Block[]) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            await saveWorkspaceBlocks(pageId, blocks);
            setIsSaving(false);
        }, 1500);
    };

    if (loadingPages) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-900 rounded-3xl border border-slate-700/50">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-900 overflow-hidden text-slate-200 rounded-3xl border border-slate-700/50 shadow-2xl transition-all duration-500">
            {/* Sidebar */}
            <aside className={`${isSidebarVisible ? 'w-64' : 'w-0'} bg-slate-800/40 backdrop-blur-2xl border-r border-slate-700/50 flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> Workspace
                    </div>
                    <button onClick={handleAddPage} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 py-4">
                    <div className="group flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer">
                        <Search className="w-4 h-4" /> Busca de Projetos
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex items-center justify-between px-3 mb-3">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Seus Projetos</p>
                            <button onClick={handleAddPage} className="p-0.5 hover:bg-slate-700 rounded text-slate-500 transition-colors"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-0.5 px-1">
                            {pages.map(page => (
                                <PageItem 
                                    key={page.id} 
                                    page={page} 
                                    active={activePageId === page.id}
                                    onClick={() => setActivePageId(page.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.1em] px-2 mb-2">
                        {isSaving ? (
                            <><Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Salvando...</>
                        ) : (
                            <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado</>
                        )}
                    </div>
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-500 hover:text-rose-400 transition-all hover:bg-rose-400/5 rounded-xl">
                        <Trash2 className="w-4 h-4" /> Lixeira
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col bg-slate-900 relative">
                {activePage ? (
                    <>
                        <header className="border-b border-slate-700/30 flex flex-col shrink-0 bg-slate-900/50 backdrop-blur-2xl z-20">
                            <div className="h-14 flex items-center justify-between px-6">
                                <div className="flex items-center gap-4 text-sm">
                                    <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className={`p-2 hover:bg-slate-800 rounded-xl transition-all ${!isSidebarVisible ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-500'}`}>
                                        <Layout className="w-4.5 h-4.5" />
                                    </button>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <ChevronRight className="w-3 h-3 shrink-0" />
                                        <span className="text-slate-300 font-bold truncate tracking-tight">{activePage.title}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedDocId(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white" title="Fechar Documento"><Search className="w-4 h-4" /></button>
                                    <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white"><Star className="w-4.5 h-4.5" /></button>
                                    <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white"><MoreHorizontal className="w-4.5 h-4.5" /></button>
                                </div>
                            </div>
                            
                            {/* Tabs Bar */}
                            <div className="flex items-center px-6 gap-8 border-t border-slate-800/50">
                                <TabButton 
                                    active={activeTab === 'tarefas'} 
                                    onClick={() => { setActiveTab('tarefas'); setSelectedDocId(null); }}
                                    label="Tarefas"
                                />
                                <TabButton 
                                    active={activeTab === 'cronograma'} 
                                    onClick={() => { setActiveTab('cronograma'); setSelectedDocId(null); }}
                                    label="Cronograma"
                                />
                                <TabButton 
                                    active={activeTab === 'documentos'} 
                                    onClick={() => setActiveTab('documentos')}
                                    label="Documentos"
                                />
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto hide-scrollbar">
                            {loadingContent ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="w-full h-full animate-in fade-in duration-500">
                                    {selectedDocId ? (
                                        <DocumentEditor 
                                            docId={selectedDocId} 
                                            onClose={() => setSelectedDocId(null)} 
                                        />
                                    ) : (
                                        <div className="p-10 max-w-6xl mx-auto">
                                            {activeTab === 'tarefas' && (
                                                <div className="space-y-6">
                                                    <h2 className="text-3xl font-black text-white tracking-tighter mb-8">Tarefas do Projeto</h2>
                                                    <div className="space-y-1">
                                                        {activePage.blocks?.filter(b => b.type === 'todo').map(block => (
                                                            <BlockComponent 
                                                                key={block.id} 
                                                                block={block} 
                                                                onChange={(newContent) => updateBlockContent(block.id, newContent)}
                                                            />
                                                        ))}
                                                        
                                                        <div className="group relative mt-6 animate-in slide-in-from-left-2 duration-300">
                                                            <div className="flex items-center gap-2 relative">
                                                                <span className="text-slate-700 select-none font-black text-xs">/</span>
                                                                <input 
                                                                    id="commandInput"
                                                                    className="w-full bg-transparent border-none outline-none text-base text-slate-400 placeholder-slate-800 py-3 font-medium"
                                                                    placeholder="Comando rápido (/ para ajuda)..."
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && e.currentTarget.value === '') handleAddBlock();
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val.startsWith('/')) {
                                                                            setShowSlashMenu(true);
                                                                            setSlashSearch(val.slice(1));
                                                                        } else {
                                                                            setShowSlashMenu(false);
                                                                        }
                                                                    }}
                                                                />

                                                                {showSlashMenu && (
                                                                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                                        <div className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50 mb-1 text-white">Adicionar Tarefa</div>
                                                                        <SlashMenuItem 
                                                                            icon={<CheckSquare className="w-4 h-4" />} 
                                                                            label="To-do List" 
                                                                            description="Adiciona nova tarefa."
                                                                            onClick={() => handleCreateBlock('todo')}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'cronograma' && (
                                                <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                                                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-sm font-black uppercase tracking-widest">Cronograma em Breve</p>
                                                </div>
                                            )}

                                            {activeTab === 'documentos' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h2 className="text-3xl font-black text-white tracking-tighter">Documentos</h2>
                                                        <button 
                                                            onClick={handleAddDocument}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-500/20"
                                                        >
                                                            <Plus className="w-4 h-4" /> Novo Documento
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {activePage.subPages?.map(doc => (
                                                            <DocumentCard 
                                                                key={doc.id} 
                                                                doc={doc} 
                                                                onClick={() => setSelectedDocId(doc.id)} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
                        <Palette className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-700">Selecione uma página</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`h-11 px-1 flex items-center border-b-2 transition-all text-xs font-black uppercase tracking-widest ${active ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
            {label}
        </button>
    );
}

function DocumentCard({ doc, onClick }: { doc: Page, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5 group"
        >
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 truncate">{doc.title}</h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Documento</p>
        </div>
    );
}

function DocumentEditor({ docId, onClose }: { docId: string, onClose: () => void }) {
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    const load = async () => {
        setLoading(true);
        const res = await getPageWithBlocks(docId);
        if (res.success) setPage(res.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, [docId]);

    const handleUpdateTitle = (title: string) => {
        if (!page) return;
        const updated = { ...page, title };
        setPage(updated);
        
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
            setIsSaving(true);
            await updateWorkspacePage(docId, { title });
            setIsSaving(false);
        }, 1000);
    };

    const handleUpdateBlock = (blockId: string, content: any) => {
        if (!page) return;
        const updatedBlocks = (page.blocks || []).map(b => b.id === blockId ? { ...b, content } : b);
        const updated = { ...page, blocks: updatedBlocks };
        setPage(updated);

        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
            setIsSaving(true);
            await saveWorkspaceBlocks(docId, updatedBlocks);
            setIsSaving(false);
        }, 1500);
    };

    const handleAddBlock = () => {
        if (!page) return;
        const newBlock = { id: crypto.randomUUID(), type: 'text', content: { text: '' }, order: page.blocks?.length || 0 };
        const updatedBlocks = [...(page.blocks || []), newBlock];
        setPage({ ...page, blocks: updatedBlocks });
        saveWorkspaceBlocks(docId, updatedBlocks);
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
    if (!page) return null;

    return (
        <div className="h-full flex flex-col bg-slate-900 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full p-10 pt-20 pb-40">
                <div className="flex items-center justify-between mb-12">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" /> Voltar aos Documentos
                    </button>
                    {isSaving && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Salvando...</span>}
                </div>

                <input 
                    value={page.title}
                    onChange={(e) => handleUpdateTitle(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-5xl font-black text-white placeholder-slate-800 tracking-tighter leading-tight mb-12"
                    placeholder="Documento sem título"
                />

                <div className="space-y-1">
                    {page.blocks?.map(block => (
                        <BlockComponent 
                            key={block.id} 
                            block={block} 
                            onChange={(content) => handleUpdateBlock(block.id, content)}
                        />
                    ))}
                    <button 
                        onClick={handleAddBlock}
                        className="w-full flex items-center gap-2 py-4 text-slate-700 hover:text-slate-500 transition-colors group"
                    >
                        <Plus className="w-4 h-4" /> <span className="text-sm font-medium">Adicionar bloco...</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function PageItem({ page, active, onClick }: { page: Page, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all ${active ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
        >
            <div className="w-4 h-4 shrink-0 flex items-center justify-center bg-slate-800 rounded group-hover:bg-slate-700">
                {page.icon || <FileText className="w-2.5 h-2.5" />}
            </div>
            <span className="truncate">{page.title}</span>
        </button>
    );
}

function SlashMenuItem({ icon, label, description, onClick }: { icon: React.ReactNode, label: string, description: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-xl transition-all text-left group"
        >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-700 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 rounded-xl transition-colors border border-slate-600/50 group-hover:border-indigo-500/30">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-tight leading-none mb-1">{label}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
            </div>
        </button>
    );
}

function BlockComponent({ block, onChange }: { block: Block, onChange: (content: any) => void }) {
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ ...block.content, text: e.target.value });
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    switch (block.type) {
        case 'h1':
            return (
                <input 
                    value={block.content.text || ''}
                    onChange={(e) => onChange({ ...block.content, text: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-3xl font-black text-white placeholder-slate-800 py-4 tracking-tighter"
                    placeholder="Título 1"
                />
            );
        case 'h2':
            return (
                <input 
                    value={block.content.text || ''}
                    onChange={(e) => onChange({ ...block.content, text: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-2xl font-bold text-slate-200 placeholder-slate-800 py-3 tracking-tight"
                    placeholder="Título 2"
                />
            );
        case 'todo':
            return (
                <div className="flex items-start gap-2 group py-1.5 min-h-[32px]">
                    <div 
                        onClick={() => onChange({ ...block.content, checked: !block.content.checked })}
                        className={`mt-1 h-4 w-4 rounded border transition-all cursor-pointer flex items-center justify-center shrink-0 ${block.content.checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
                    >
                        {block.content.checked && <div className="text-white text-[10px] font-black">✓</div>}
                    </div>
                    <textarea 
                        value={block.content.text || ''}
                        onChange={handleTextChange}
                        rows={1}
                        className={`w-full bg-transparent border-none outline-none text-base placeholder-slate-800 resize-none transition-all ${block.content.checked ? 'text-slate-600 line-through' : 'text-slate-300'}`}
                        placeholder="Tarefa..."
                        onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                </div>
            );
        case 'database':
            return <DatabaseBlock />;
        default:
            return (
                <div className="group relative flex items-center gap-2">
                    <textarea 
                        value={block.content.text || ''}
                        onChange={handleTextChange}
                        rows={1}
                        className="w-full bg-transparent border-none outline-none text-base text-slate-400 leading-relaxed py-2 font-medium placeholder-slate-800 resize-none scroll-hide"
                        placeholder="Escreva algo..."
                        onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                </div>
            );
    }
}
