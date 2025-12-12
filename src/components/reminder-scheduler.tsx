'use client';

import { reminders } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { addReminder, deleteReminder, getReminders, getGeneralReminders, snoozeReminder } from '@/app/actions';
import { useState, useEffect } from 'react';

type Reminder = InferSelectModel<typeof reminders>;

interface ReminderSchedulerProps {
    itemId?: string; // If present, it's for a specific item
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
    const [title, setTitle] = useState(''); // Only for General Reminders

    // Snooze Menu State
    const [snoozeExpandedId, setSnoozeExpandedId] = useState<string | null>(null);

    // Close snooze menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setSnoozeExpandedId(null);
        if (snoozeExpandedId) {
            window.addEventListener('click', handleClickOutside);
        }
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

    const handleAddReminder = async () => {
        if (!datePart || !timePart) return;
        if (isGeneral && !title.trim()) return;

        const fullDate = new Date(`${datePart}T${timePart}`);

        setIsPending(true);
        try {
            await addReminder(fullDate, recurrence, itemId, isGeneral ? title : undefined);
            await fetchReminders();
            // Reset form
            setDatePart('');
            setTimePart('');
            setRecurrence('none');
            setTitle('');
        } catch (error) {
            console.error(error);
            alert("Failed to add reminder");
        } finally {
            setIsPending(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        setIsPending(true);
        await deleteReminder(id);
        setExistingReminders(prev => prev.filter(r => r.id !== id));
        setIsPending(false);
    };

    const handleSnoozeReminder = async (id: string, minutes: number) => {
        setIsPending(true);
        await snoozeReminder(id, minutes);
        await fetchReminders();
        setSnoozeExpandedId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="relative bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{isGeneral ? 'General Reminders' : 'Item Reminders'}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{isGeneral ? 'Set personal reminders' : 'Manage reminders for this item'}</p>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-0">

                    {/* Upcoming Reminders Section */}
                    <div className="px-6 py-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Upcoming</h4>
                        {isLoadingReminders ? (
                            <div className="flex justify-center py-8">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : existingReminders.length === 0 ? (
                            <div className="text-center py-6 px-4 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm text-zinc-400 dark:text-zinc-500">No active reminders</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {existingReminders.map(reminder => (
                                    <div key={reminder.id} className="relative group overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-900">

                                        {/* Main Row Content */}
                                        <div className="p-3 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                                        {reminder.title || new Date(reminder.scheduledAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="ml-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                                                    {reminder.title && (
                                                        <span className="mr-1">{new Date(reminder.scheduledAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                                                    )}
                                                    {new Date(reminder.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    {reminder.recurrence !== 'none' && <span className="text-blue-500 ml-1 capitalize">• {reminder.recurrence}</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setSnoozeExpandedId(snoozeExpandedId === reminder.id ? null : reminder.id)}
                                                    className={`p-2 rounded-lg transition-all ${snoozeExpandedId === reminder.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-zinc-400 hover:text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                                    title="Snooze"
                                                >
                                                    <ClockIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReminder(reminder.id)}
                                                    className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline Snooze Panel (Expands) */}
                                        {snoozeExpandedId === reminder.id && (
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex gap-2">
                                                    {[10, 30, 60].map(mins => (
                                                        <button
                                                            key={mins}
                                                            onClick={() => handleSnoozeReminder(reminder.id, mins)}
                                                            className="flex-1 py-1.5 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-500 transition-colors shadow-sm"
                                                        >
                                                            +{mins}m
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New Section */}
                    <div className="px-6 pb-6 pt-2">
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">New Reminder</h4>

                            {/* Title Input (General Mode Only) */}
                            {isGeneral && (
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Read for 15 mins"
                                        className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Date & Time Inputs Split */}
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">When?</label>
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        value={datePart}
                                        onChange={(e) => setDatePart(e.target.value)}
                                    />
                                </div>
                                <div className="relative w-1/3">
                                    <input
                                        type="time"
                                        className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow text-center"
                                        value={timePart}
                                        onChange={(e) => setTimePart(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Recurrence Chips */}
                            <label className="block text-xs font-semibold text-zinc-500 mb-2 ml-1">Repeat?</label>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {(['none', 'daily', 'weekly', 'monthly'] as const).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRecurrence(r)}
                                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${recurrence === r ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                                    >
                                        {r === 'none' ? 'Once' : r}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={!datePart || !timePart || (isGeneral && !title) || isPending}
                                onClick={handleAddReminder}
                                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        <span>Set Reminder</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    )
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
