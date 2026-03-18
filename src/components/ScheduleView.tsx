'use client'

import { useState, useEffect } from 'react';
import { 
    CalendarDays, 
    Calendar as CalendarIcon, 
    LayoutGrid, 
    Plus, 
    Trash2, 
    Clock, 
    Star, 
    ChevronLeft, 
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { 
    getWeeklyTasks, 
    addWeeklyTask, 
    deleteWeeklyTask, 
    getCalendarEvents, 
    addCalendarEvent, 
    deleteCalendarEvent, 
    toggleEventPermanent 
} from '../../app/actions';

const DAYS_OF_WEEK = [
    { id: 1, name: 'Segunda', color: 'border-blue-500/30' },
    { id: 2, name: 'Terça', color: 'border-emerald-500/30' },
    { id: 3, name: 'Quarta', color: 'border-amber-500/30' },
    { id: 4, name: 'Quinta', color: 'border-purple-500/30' },
    { id: 5, name: 'Sexta', color: 'border-rose-500/30' },
    { id: 6, name: 'Sábado', color: 'border-indigo-500/30' },
];

export function ScheduleView() {
    const [activeTab, setActiveTab] = useState<'weekly' | 'calendar'>('weekly');
    const [isEditingWeekly, setIsEditingWeekly] = useState(false);
    
    // Weekly State
    const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
    const [newWeeklyTitle, setNewWeeklyTitle] = useState('');
    const [newWeeklyTime, setNewWeeklyTime] = useState('');
    const [addingToDay, setAddingToDay] = useState<number | null>(null);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventIsPermanent, setNewEventIsPermanent] = useState(false);
    const [selectedUser, setSelectedUser] = useState('Eduardo');
    const users = ['Eduardo', 'Eliane', 'Regina', 'Usuário 4'];

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentDate, activeTab, selectedUser]);

    const loadData = async () => {
        setIsLoading(true);
        if (activeTab === 'weekly') {
            const tasks = await getWeeklyTasks(selectedUser);
            setWeeklyTasks(tasks);
        } else {
            // Get first and last day of current month view
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const events = await getCalendarEvents(start, end, selectedUser);
            setCalendarEvents(events);
        }
        setIsLoading(false);
    };

    // --- Weekly Logic ---
    const handleAddWeeklyTask = async (dayId: number) => {
        if (!newWeeklyTitle.trim()) return;
        setIsLoading(true);
        const res = await addWeeklyTask({ dayOfWeek: dayId, title: newWeeklyTitle, time: newWeeklyTime, userId: selectedUser });
        if (res.success) {
            setNewWeeklyTitle('');
            setNewWeeklyTime('');
            setAddingToDay(null);
            await loadData();
        }
        setIsLoading(false);
    };

    const handleDeleteWeeklyTask = async (id: string) => {
        setIsLoading(true);
        await deleteWeeklyTask(id);
        await loadData();
        setIsLoading(false);
    };

    // --- Calendar Logic ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const getHolidays = (year: number, month: number) => {
        const holidays: { day: number, title: string, isHoliday: boolean }[] = [];
        
        // Fixed National Holidays
        const fixed = [
            { m: 0, d: 1, t: 'Confraternização Universal' },
            { m: 3, d: 21, t: 'Tiradentes / Aniv. Itapema' },
            { m: 4, d: 1, t: 'Dia do Trabalho' },
            { m: 5, d: 13, t: 'Santo Antônio (Itapema)' },
            { m: 8, d: 7, t: 'Independência do Brasil' },
            { m: 9, d: 12, t: 'Nossa Senhora Aparecida' },
            { m: 10, d: 2, t: 'Finados' },
            { m: 10, d: 15, t: 'Proclamação da República' },
            { m: 11, d: 25, t: 'Natal' },
        ];

        fixed.forEach(h => {
            if (h.m === month) holidays.push({ day: h.d, title: h.t, isHoliday: true });
        });

        // Mobile Holidays (Easter-based)
        const getEaster = (y: number) => {
            const f = Math.floor,
                G = y % 19,
                C = f(y / 100),
                H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
                I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
                J = (y + f(y / 4) + I + 2 - C + f(C / 4)) % 7,
                L = I - J,
                m = 3 + f((L + 40) / 44),
                d = L + 28 - 31 * f(m / 4);
            return new Date(y, m - 1, d);
        };

        const easter = getEaster(year);
        const addMobile = (date: Date, title: string) => {
            if (date.getMonth() === month) holidays.push({ day: date.getDate(), title, isHoliday: true });
        };

        // Carnival (47 days before Easter)
        const carnival = new Date(easter);
        carnival.setDate(easter.getDate() - 47);
        addMobile(carnival, 'Carnaval');

        // Good Friday (2 days before Easter)
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        addMobile(goodFriday, 'Sexta-feira Santa');

        // Corpus Christi (60 days after Easter)
        const corpus = new Date(easter);
        corpus.setDate(easter.getDate() + 60);
        addMobile(corpus, 'Corpus Christi');

        return holidays;
    };

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const holidays = getHolidays(year, month);
        
        const days = [];
        
        // Blank spaces
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`blank-${i}`} className="p-2 border border-slate-700/30 bg-slate-900/10 min-h-[100px] rounded-lg"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = new Date().toDateString() === date.toDateString();
            
            // Filter events for this day
            const dayEvents = calendarEvents.filter(e => {
                if (e.isPermanent) {
                    return new Date(e.date).getDate() === day;
                }
                return new Date(e.date).toDateString() === date.toDateString();
            });

            // Find holidays for this day
            const dayHolidays = holidays.filter(h => h.day === day);

            days.push(
                <div 
                    key={day} 
                    onClick={() => { setSelectedDate(date); setIsEventModalOpen(true); }}
                    className={`p-2 border border-slate-700/50 min-h-[100px] rounded-lg cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/80 group ${isToday ? 'bg-indigo-900/20 shadow-inner' : 'bg-slate-800/40'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-500 text-white' : dayHolidays.length > 0 ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}>
                            {day}
                        </span>
                        <Plus className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                        {dayHolidays.map((h, i) => (
                            <div key={`hol-${i}`} className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-tighter truncate">
                                🇧🇷 {h.title}
                            </div>
                        ))}
                        {dayEvents.map(evt => (
                            <div 
                                key={evt.id} 
                                onClick={(e) => { e.stopPropagation(); togglePermanent(evt.id, evt.isPermanent); }}
                                className={`text-[10px] px-1.5 py-1 rounded-md truncate font-medium flex items-center justify-between group/evt ${evt.isPermanent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}
                                title={evt.title}
                            >
                                <span className="truncate">{evt.title}</span>
                                {evt.isPermanent ? (
                                    <Star className="w-2.5 h-2.5 text-amber-400 min-w-max" fill="currentColor" />
                                ) : (
                                    <Star className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover/evt:opacity-100 transition-opacity min-w-max" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const handleAddCalendarEvent = async () => {
        if (!newEventTitle.trim() || !selectedDate) return;
        setIsLoading(true);
        const res = await addCalendarEvent({ 
            title: newEventTitle, 
            date: selectedDate, 
            isPermanent: newEventIsPermanent,
            userId: selectedUser
        });
        if (res.success) {
            setNewEventTitle('');
            setNewEventIsPermanent(false);
            setIsEventModalOpen(false);
            await loadData();
        }
        setIsLoading(false);
    };

    const togglePermanent = async (id: string, current: boolean) => {
        setIsLoading(true);
        await toggleEventPermanent(id, current);
        await loadData();
        setIsLoading(false);
    };

    const deleteEvent = async (id: string) => {
        setIsLoading(true);
        await deleteCalendarEvent(id);
        await loadData();
        setIsLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CalendarDays className="w-8 h-8 text-indigo-400" />
                        Planejamento & Escala
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-lg">
                        Gerencie a rotina semanal dos funcionários e eventos mensais. Marque eventos como permanentes para que se repitam todo mês.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto">
                    <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700">
                        {users.map(u => (
                            <button
                                key={u}
                                onClick={() => setSelectedUser(u)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedUser === u ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setActiveTab('weekly')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'weekly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-100' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Rotina Semanal
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-100' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <CalendarIcon className="w-4 h-4" /> Calendário Mensal
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-4">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* TAB: WEEKLY SCHEDULE */}
            {activeTab === 'weekly' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                {isEditingWeekly ? 'Editando Rotina Semanal' : 'Rotina de Hoje'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isEditingWeekly ? 'Gerencie as tarefas fixas de todos os dias da semana.' : 'Aqui estão as suas tarefas fixas programadas para o dia atual.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsEditingWeekly(!isEditingWeekly)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isEditingWeekly ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
                        >
                            {isEditingWeekly ? 'Concluir Edição' : 'Editar Semana Completa'}
                        </button>
                    </div>

                    {!isEditingWeekly ? (
                        <div className="max-w-3xl mx-auto">
                            {(() => {
                                const todayId = new Date().getDay();
                                const todayObj = DAYS_OF_WEEK.find(d => d.id === todayId);
                                
                                if (!todayObj) {
                                    return (
                                        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 text-center shadow-lg">
                                            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Star className="w-8 h-8 text-amber-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Hoje é Domingo!</h3>
                                            <p className="text-slate-400">Aproveite o seu dia de descanso. Nenhuma rotina programada.</p>
                                        </div>
                                    );
                                }

                                const dayTasks = weeklyTasks.filter(t => t.dayOfWeek === todayObj.id);
                                return (
                                    <div className="bg-slate-800 rounded-2xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/10 overflow-hidden">
                                        <div className="p-6 bg-indigo-900/30 border-b border-indigo-500/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-indigo-200 text-2xl">{todayObj.name}</h3>
                                                <span className="text-[10px] px-3 py-1 rounded-full bg-indigo-500 font-bold text-white uppercase tracking-widest shadow-lg shadow-indigo-500/40">Hoje</span>
                                            </div>
                                            <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300">
                                                {dayTasks.length} rotinas
                                            </span>
                                        </div>
                                        
                                        <div className="p-6 flex flex-col gap-3 min-h-[300px]">
                                            {dayTasks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                                    <p>Nenhuma tarefa listada para hoje.</p>
                                                </div>
                                            ) : (
                                                dayTasks.map(task => (
                                                    <div key={task.id} className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex justify-between items-center group hover:bg-indigo-500/20 transition-colors">
                                                        <p className="text-lg font-medium text-indigo-100">{task.title}</p>
                                                        {task.time && (
                                                            <p className="text-sm text-indigo-300 flex items-center gap-2 font-mono bg-indigo-900/50 px-3 py-1.5 rounded-lg">
                                                                <Clock className="w-4 h-4" /> {task.time}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-2 pb-4">
                            {DAYS_OF_WEEK.map(day => {
                                const dayTasks = weeklyTasks.filter(t => t.dayOfWeek === day.id);
                                
                                return (
                                    <div key={day.id} className={`bg-slate-800/80 rounded-2xl border ${day.color} flex flex-col h-full overflow-hidden shadow-lg backdrop-blur-sm transition-all hover:border-indigo-500/50`}>
                                        <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                                            <h3 className="font-bold text-slate-200">{day.name}</h3>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                {dayTasks.length} rotinas
                                            </span>
                                        </div>
                                        
                                        <div className="p-3 flex-1 flex flex-col gap-2 min-h-[250px] overflow-y-auto">
                                            {dayTasks.map(task => (
                                                <div key={task.id} className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 group relative hover:bg-slate-700/50 transition-colors">
                                                    <p className="text-sm text-slate-200 font-medium pr-6">{task.title}</p>
                                                    {task.time && (
                                                        <p className="text-xs text-indigo-300 mt-2 flex items-center gap-1.5 font-mono">
                                                            <Clock className="w-3 h-3" /> {task.time}
                                                        </p>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteWeeklyTask(task.id)}
                                                        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            {addingToDay === day.id ? (
                                                <div className="bg-slate-900/80 rounded-xl p-3 border border-indigo-500/50 shadow-lg shadow-indigo-500/10 mt-auto animate-in fade-in slide-in-from-bottom-2">
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        placeholder="Descreva a tarefa..."
                                                        value={newWeeklyTitle}
                                                        onChange={e => setNewWeeklyTitle(e.target.value)}
                                                        className="w-full bg-transparent border-b border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 pb-1 mb-3"
                                                        onKeyDown={e => e.key === 'Enter' && handleAddWeeklyTask(day.id)}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                                            <input 
                                                                type="time" 
                                                                value={newWeeklyTime}
                                                                onChange={e => setNewWeeklyTime(e.target.value)}
                                                                className="w-full bg-slate-800 rounded-lg py-1.5 pl-7 pr-2 text-xs text-slate-300 outline-none border border-slate-700 focus:border-indigo-500"
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAddWeeklyTask(day.id)}
                                                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-1.5 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setAddingToDay(null); setNewWeeklyTitle(''); setNewWeeklyTime(''); }}
                                                            className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-1.5 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setAddingToDay(day.id)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 mt-auto rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Adicionar Rotina
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: MONTHLY CALENDAR */}
            {activeTab === 'calendar' && (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-900/30">
                        <h2 className="text-xl font-bold text-white capitalize flex items-center gap-4">
                            <span className="bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-lg border border-indigo-500/30">
                                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </div>
            )}

            {/* EVENT MODAL */}
            {isEventModalOpen && selectedDate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Gerencie os eventos para esta data.</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Insert New Event */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nova Tarefa / Evento</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Pagar Manutenção do Elevador"
                                        value={newEventTitle}
                                        onChange={e => setNewEventTitle(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all">
                                    <input 
                                        type="checkbox" 
                                        checked={newEventIsPermanent}
                                        onChange={e => setNewEventIsPermanent(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500/50"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                            Tornar Permanente <Star className="w-3.5 h-3.5 text-amber-400" />
                                        </p>
                                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                            Essa tarefa se repetirá em todo dia {selectedDate.getDate()} dos próximos meses continuamente.
                                        </p>
                                    </div>
                                </label>
                                <button 
                                    onClick={handleAddCalendarEvent}
                                    disabled={!newEventTitle.trim()}
                                    className="w-full bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Adicionar ao Calendário
                                </button>
                            </div>

                            {/* Existing Events */}
                            <div className="space-y-3 pt-6 border-t border-slate-700">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tarefas de Hoje</label>
                                {calendarEvents
                                    .filter(e => {
                                        if (e.isPermanent) return new Date(e.date).getDate() === selectedDate.getDate();
                                        return new Date(e.date).toDateString() === selectedDate.toDateString();
                                    })
                                    .map(evt => (
                                        <div key={evt.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/50 group">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => togglePermanent(evt.id, evt.isPermanent)}
                                                    className={`p-1.5 rounded-lg border transition-all ${evt.isPermanent ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-amber-400'}`}
                                                    title={evt.isPermanent ? "Remover Permanência" : "Tornar Permanente"}
                                                >
                                                    <Star className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-medium text-slate-300">{evt.title}</span>
                                            </div>
                                            <button 
                                                onClick={() => deleteEvent(evt.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-lg hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
                            <button 
                                onClick={() => { setIsEventModalOpen(false); setNewEventTitle(''); setNewEventIsPermanent(false); }}
                                className="px-5 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
