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
    orderNr?: number;
}

interface Page {
    id: string;
    title: string;
    icon?: string | null;
    blocks?: Block[];
    subPages?: Page[];
}

export function WorkspaceView() {
    const [pages, setPages] = useState<Page[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [activePage, setActivePage] = useState<Page | null>(null);
    const [loadingPages, setLoadingPages] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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
        const res = await createWorkspacePage("Página sem título");
        if (res.success) {
            setPages(prev => [...prev, res.data]);
            setActivePageId(res.data.id);
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
        const newBlock = { id: crypto.randomUUID(), type: 'text', content: { text: '' }, orderNr: activePage.blocks?.length || 0 };
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
            orderNr: activePage.blocks?.length || 0 
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
                        <Search className="w-4 h-4" /> Busca Global
                    </div>
                    <div className="group flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer">
                        <Clock className="w-4 h-4" /> Recentes
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex items-center justify-between px-3 mb-3">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Suas Páginas</p>
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
                        <header className="h-14 border-b border-slate-700/30 flex items-center justify-between px-6 shrink-0 bg-slate-900/50 backdrop-blur-2xl z-20">
                            <div className="flex items-center gap-4 text-sm">
                                <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className={`p-2 hover:bg-slate-800 rounded-xl transition-all ${!isSidebarVisible ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-500'}`}>
                                    <Layout className="w-4.5 h-4.5" />
                                </button>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <FileText className="w-4 h-4 shrink-0 transition-all group-hover:scale-110" />
                                    <ChevronRight className="w-3 h-3 shrink-0" />
                                    <span className="text-slate-300 font-bold truncate tracking-tight">{activePage.title}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button className="text-[11px] font-black text-slate-400 hover:text-indigo-300 transition-all flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50 uppercase tracking-widest hover:border-indigo-500/30 shadow-lg shadow-indigo-500/5 group">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-125 transition-transform" /> Perguntar à IA
                                </button>
                                <div className="h-6 w-px bg-slate-800"></div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white"><Share2 className="w-4.5 h-4.5" /></button>
                                    <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white"><Star className="w-4.5 h-4.5" /></button>
                                    <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all hover:text-white"><MoreHorizontal className="w-4.5 h-4.5" /></button>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto pt-16 hide-scrollbar">
                            {loadingContent ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto px-10 pb-40 animate-in fade-in duration-500">
                                    <div className="text-6xl mb-6 group-hover:scale-110 transition-all cursor-pointer origin-left w-20 h-20 flex items-center justify-center rounded-3xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800 shadow-xl">
                                        {activePage.icon || '📄'}
                                    </div>
                                    <input 
                                        value={activePage.title}
                                        onChange={(e) => handleUpdateTitle(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-5xl font-black text-white placeholder-slate-800 tracking-tighter leading-tight selection:bg-indigo-500/20"
                                        placeholder="Página sem título"
                                    />

                                    <div className="mt-12 space-y-1">
                                        {activePage.blocks?.map(block => (
                                            <BlockComponent 
                                                key={block.id} 
                                                block={block} 
                                                onChange={(newContent) => updateBlockContent(block.id, newContent)}
                                                onSlash={() => {
                                                    // Slash support inside block
                                                }}
                                            />
                                        ))}
                                        
                                        <div className="group relative mt-6 animate-in slide-in-from-left-2 duration-300">
                                            <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                                <button onClick={handleAddBlock} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-600 hover:text-indigo-400"><Plus className="w-4 h-4" /></button>
                                            </div>
                                            <div className="flex items-center gap-2 relative">
                                                <span className="text-slate-700 select-none font-black text-xs">/</span>
                                                <input 
                                                    id="commandInput"
                                                    className="w-full bg-transparent border-none outline-none text-base text-slate-400 placeholder-slate-800 py-3 font-medium"
                                                    placeholder="Comando rápido (/ para ajuda)..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            if (e.currentTarget.value === '') {
                                                                handleAddBlock();
                                                            }
                                                        }
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

                                                {/* Slash Menu Portal */}
                                                {showSlashMenu && (
                                                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-3xl overflow-hidden">
                                                        <div className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50 mb-1">Blocos Básicos</div>
                                                        <div className="space-y-0.5">
                                                            <SlashMenuItem 
                                                                icon={<Type className="w-4 h-4" />} 
                                                                label="Texto" 
                                                                description="Comece a escrever com texto puro."
                                                                onClick={() => handleCreateBlock('text')}
                                                            />
                                                            <SlashMenuItem 
                                                                icon={<div className="font-black text-xs">H1</div>} 
                                                                label="Título 1" 
                                                                description="Título de seção grande."
                                                                onClick={() => handleCreateBlock('h1')}
                                                            />
                                                            <SlashMenuItem 
                                                                icon={<div className="font-black text-xs">H2</div>} 
                                                                label="Título 2" 
                                                                description="Título de seção médio."
                                                                onClick={() => handleCreateBlock('h2')}
                                                            />
                                                            <SlashMenuItem 
                                                                icon={<CheckSquare className="w-4 h-4" />} 
                                                                label="To-do List" 
                                                                description="Controle de tarefas simples."
                                                                onClick={() => handleCreateBlock('todo')}
                                                            />
                                                            <SlashMenuItem 
                                                                icon={<Database className="w-4 h-4" />} 
                                                                label="Tabela / Banco" 
                                                                description="Organize em dados estruturados."
                                                                onClick={() => handleCreateBlock('database')}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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

function SlashMenuItem({ icon, label, description, onClick }: { icon: React.ReactNode, label: string, description: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-xl transition-all text-left group"
        >
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-700 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 rounded-xl transition-colors border border-slate-600/50 group-hover:border-indigo-500/30">
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-200">{label}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
            </div>
        </button>
    );
}

function PageItem({ page, active, onClick }: { page: Page, active: boolean, onClick: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="space-y-0.5">
            <div 
                onClick={onClick}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${active ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-lg' : 'text-slate-500 hover:bg-slate-700/30'}`}
            >
                <div className="flex items-center gap-2 truncate">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className={`p-1 hover:bg-slate-700 rounded-md transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    >
                        <ChevronRight className={`w-3 h-3 ${active ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                    <span className="shrink-0 text-lg group-hover:scale-110 transition-transform">{page.icon || '📄'}</span>
                    <span className="truncate font-black uppercase tracking-widest text-[9px]">{page.title}</span>
                </div>
            </div>
            {isOpen && page.subPages && page.subPages.length > 0 && (
                <div className="pl-6 border-l border-slate-700/40 ml-5 mt-1 space-y-0.5">
                    {page.subPages.map(sub => (
                        <PageItem key={sub.id} page={sub} active={false} onClick={() => {}} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BlockComponent({ block, onChange, onSlash }: { block: Block, onChange: (content: any) => void, onSlash?: () => void }) {
    const [localText, setLocalText] = useState(block.content?.text || '');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setLocalText(block.content?.text || '');
    }, [block.content?.text]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalText(e.target.value);
        onChange({ ...block.content, text: e.target.value });
        
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    switch (block.type) {
        case 'h1':
            return (
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={localText}
                    onChange={handleTextChange}
                    className="w-full bg-transparent border-none outline-none text-4xl font-black text-white mt-12 mb-6 tracking-tighter leading-tight resize-none scroll-hide"
                    placeholder="Título 1"
                />
            );
        case 'h2':
            return (
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={localText}
                    onChange={handleTextChange}
                    className="w-full bg-transparent border-none outline-none text-2xl font-black text-white mt-10 mb-5 tracking-tight border-l-4 border-indigo-500 pl-6 resize-none scroll-hide"
                    placeholder="Título 2"
                />
            );
        case 'todo':
            return (
                <div className="flex items-start gap-4 py-2 group hover:translate-x-1 transition-all duration-300">
                    <div className="relative flex items-center justify-center mt-1 shrink-0">
                         <input 
                            type="checkbox" 
                            checked={block.content.checked} 
                            onChange={(e) => onChange({ ...block.content, checked: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600" 
                         />
                         {block.content.checked && <div className="absolute text-white text-[10px] font-black">✓</div>}
                    </div>
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={localText}
                        onChange={handleTextChange}
                        className={`w-full bg-transparent border-none outline-none text-base font-medium resize-none transition-all ${block.content.checked ? 'text-slate-600 line-through decoration-2 decoration-indigo-500/50' : 'text-slate-300'}`}
                        placeholder="To-do list"
                    />
                </div>
            );
        case 'database':
            return <DatabaseBlock />;
        default:
            return (
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={localText}
                    onChange={handleTextChange}
                    className="w-full bg-transparent border-none outline-none text-base text-slate-400 leading-relaxed py-3 font-medium selection:bg-indigo-500/10 resize-none scroll-hide"
                    placeholder="Digite algo..."
                />
            );
    }
}
