'use client';

import { reminders } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { addReminder, deleteReminder, getReminders, getGeneralReminders, snoozeReminder } from '@/app/actions';
import { useState, useEffect, useMemo } from 'react';
import {
    Clock, Trash2, Calendar, Bell, Plus, ChevronRight,
    Sparkles, Coffee, Moon, Sun, Sunrise, CalendarDays,
    ChevronDown, ChevronUp
} from 'lucide-react';

type Reminder = InferSelectModel<typeof reminders>;

interface ReminderSchedulerProps {
    itemId?: string;
    onClose: () => void;
}

export function ReminderScheduler({ itemId, onClose }: ReminderSchedulerProps) {
    const isGeneral = !itemId;
    const [isPending, setIsPending] = useState(false);

    // Reminder State
    const [existingReminders, setExistingReminders] = useState<Reminder[]>([]);
    const [isLoadingReminders, setIsLoadingReminders] = useState(false);

    // Form State
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [title, setTitle] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    // Snooze Menu State
    const [snoozeExpandedId, setSnoozeExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = () => setSnoozeExpandedId(null);
        if (snoozeExpandedId) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [snoozeExpandedId]);

    const fetchReminders = async () => {
        setIsLoadingReminders(true);
        try {
            const data = isGeneral ? await getGeneralReminders() : await getReminders(itemId!);
            setExistingReminders(data);
        } finally {
            setIsLoadingReminders(false);
        }
    };

    useEffect(() => {
        fetchReminders();
    }, [itemId, isGeneral]);

    // Helpers for Presets
    const setPreset = (type: 'later' | 'evening' | 'tomorrow' | 'weekend') => {
        const now = new Date();
        let target = new Date();

        if (type === 'later') {
            target.setHours(now.getHours() + 3);
        } else if (type === 'evening') {
            target.setHours(20, 0, 0, 0); // 8 PM
            if (target < now) target.setDate(target.getDate() + 1);
        } else if (type === 'tomorrow') {
            target.setDate(now.getDate() + 1);
            target.setHours(9, 0, 0, 0); // 9 AM
        } else if (type === 'weekend') {
            const day = now.getDay();
            const diff = (day === 0 ? 6 : 6 - day); // Until Saturday
            target.setDate(now.getDate() + diff);
            target.setHours(10, 0, 0, 0); // 10 AM
        }

        setDatePart(target.toISOString().split('T')[0]);
        setTimePart(target.toTimeString().split(' ')[0].substring(0, 5));
        setShowCustom(false);
    };

    const adjustTime = (mins: number) => {
        const current = new Date(`${datePart || new Date().toISOString().split('T')[0]}T${timePart || '12:00'}`);
        current.setMinutes(current.getMinutes() + mins);
        setDatePart(current.toISOString().split('T')[0]);
        setTimePart(current.toTimeString().split(' ')[0].substring(0, 5));
    };

    const liveSummary = useMemo(() => {
        if (!datePart || !timePart) return null;
        const target = new Date(`${datePart}T${timePart}`);
        const now = new Date();
        const diffMs = target.getTime() - now.getTime();

        if (diffMs < 0) return "Time is in the past";

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays === 0) {
            if (diffHours === 0) return `In about ${Math.floor(diffMs / 60000)} minutes`;
            return `In about ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        }
        if (diffDays === 1) return "Tomorrow morning";
        return `In ${diffDays} days`;
    }, [datePart, timePart]);

    const handleAddReminder = async () => {
        if (!datePart || !timePart) return;
        if (isGeneral && !title.trim()) return;

        const fullDate = new Date(`${datePart}T${timePart}`);
        setIsPending(true);
        try {
            await addReminder(fullDate, recurrence, itemId, isGeneral ? title : undefined);
            await fetchReminders();
            setDatePart('');
            setTimePart('');
            setRecurrence('none');
            setTitle('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        try {
            await deleteReminder(id);
            await fetchReminders();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSnooze = async (id: string, mins: number) => {
        try {
            await snoozeReminder(id, mins);
            await fetchReminders();
            setSnoozeExpandedId(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="w-full max-w-md bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 dark:border-zinc-800/50 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-500 fill-current" />
                            {isGeneral ? 'New Note' : 'Remind Me'}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">Power Scheduler</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5 rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8">

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <PresetBtn icon={<Coffee className="w-4 h-4" />} label="In 3 hours" onClick={() => setPreset('later')} />
                        <PresetBtn icon={<Moon className="w-4 h-4" />} label="Tonight (8pm)" onClick={() => setPreset('evening')} />
                        <PresetBtn icon={<Sunrise className="w-4 h-4" />} label="Tomorrow" onClick={() => setPreset('tomorrow')} />
                        <PresetBtn icon={<CalendarDays className="w-4 h-4" />} label="This Weekend" onClick={() => setPreset('weekend')} />
                    </div>

                    {/* Quick Nudges (Only if date/time set) */}
                    {(datePart || timePart) && (
                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                            <button onClick={() => adjustTime(60)} className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-500 hover:text-blue-500 hover:bg-blue-50 transition-all">+1 Hour</button>
                            <button onClick={() => adjustTime(180)} className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-500 hover:text-blue-500 hover:bg-blue-50 transition-all">+3 Hours</button>
                            <button onClick={() => adjustTime(1440)} className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-500 hover:text-blue-500 hover:bg-blue-50 transition-all">+1 Day</button>
                        </div>
                    )}

                    {/* Custom Section Toggle */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowCustom(!showCustom)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-sm font-bold group"
                        >
                            <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-500 transition-colors">
                                <Calendar className="w-4 h-4" />
                                Custom Reminder
                            </span>
                            {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showCustom && (
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-4 animate-in slide-in-from-top-4">
                                {isGeneral && (
                                    <input
                                        type="text"
                                        placeholder="What should I remind you?"
                                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-bold shadow-inner"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                )}
                                <div className="flex gap-2">
                                    <input type="date" value={datePart} onChange={e => setDatePart(e.target.value)} className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-bold shadow-inner" />
                                    <input type="time" value={timePart} onChange={e => setTimePart(e.target.value)} className="w-1/3 bg-white dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-bold shadow-inner" />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['none', 'daily', 'weekly', 'monthly'] as const).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setRecurrence(r)}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${recurrence === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}
                                        >
                                            {r === 'none' ? 'Once' : r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action & Summary */}
                    <div className="space-y-4 pt-4">
                        {liveSummary && (
                            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm italic animate-in zoom-in">
                                <Sparkles className="w-4 h-4" />
                                {liveSummary}
                            </div>
                        )}
                        <button
                            disabled={!datePart || !timePart || (isGeneral && !title) || isPending}
                            onClick={handleAddReminder}
                            className="w-full py-5 rounded-[24px] bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-lg shadow-xl shadow-blue-500/30 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            {isPending ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Set Reminder'}
                        </button>
                    </div>

                    {/* List of existing */}
                    {existingReminders.length > 0 && (
                        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Pending Reminders</h4>
                            <div className="space-y-3">
                                {existingReminders.map(r => (
                                    <div key={r.id} className="relative">
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group">
                                            <div>
                                                <p className="text-sm font-bold">{r.title || new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-[10px] text-zinc-400 font-medium">{new Date(r.scheduledAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setSnoozeExpandedId(snoozeExpandedId === r.id ? null : r.id)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:scale-110 transition-transform"><Clock className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteReminder(r.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        {snoozeExpandedId === r.id && (
                                            <div className="absolute top-full right-0 mt-2 z-10 w-48 p-2 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
                                                <div className="grid grid-cols-1 gap-1">
                                                    <button onClick={() => handleSnooze(r.id, 10)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-colors flex items-center justify-between">
                                                        +10 Minutes
                                                        <ChevronRight className="w-3 h-3 text-zinc-400" />
                                                    </button>
                                                    <button onClick={() => handleSnooze(r.id, 60)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-colors flex items-center justify-between">
                                                        +1 Hour
                                                        <ChevronRight className="w-3 h-3 text-zinc-400" />
                                                    </button>
                                                    <button onClick={() => handleSnooze(r.id, 1440)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-colors flex items-center justify-between">
                                                        +1 Day
                                                        <ChevronRight className="w-3 h-3 text-zinc-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PresetBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-[28px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 group transition-all"
        >
            <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-500 group-hover:text-blue-500 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}
