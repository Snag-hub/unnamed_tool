'use client';

import { createMeeting } from '@/app/meeting-actions';
import { useState } from 'react';

interface CreateMeetingDialogProps {
    onClose: () => void;
}

export function CreateMeetingDialog({ onClose }: CreateMeetingDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [type, setType] = useState<'general' | 'interview'>('general');
    const [stage, setStage] = useState<'screening' | 'technical' | 'culture' | 'offer' | 'rejected'>('screening');
    const [reminderOffset, setReminderOffset] = useState<number>(0);
    const [customReminders, setCustomReminders] = useState<number[]>([]);
    const [newCustomMinutes, setNewCustomMinutes] = useState('');
    const [isPending, setIsPending] = useState(false);

    const addCustomReminder = () => {
        const mins = parseInt(newCustomMinutes);
        if (mins > 0 && !customReminders.includes(mins)) {
            setCustomReminders([...customReminders, mins].sort((a, b) => b - a));
            setNewCustomMinutes('');
        }
    };

    const removeCustomReminder = (mins: number) => {
        setCustomReminders(customReminders.filter(m => m !== mins));
    };

    const handleCreate = async () => {
        if (!title.trim() || !startTime || !endTime) return;

        setIsPending(true);
        try {
            await createMeeting({
                title,
                description,
                link,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type,
                stage: type === 'interview' ? stage : undefined,
                reminderOffset,
                customReminders,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create meeting');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                <div className="relative bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">New Meeting</h3>
                    <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="Checking sync"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Description (Optional)</label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                            placeholder="Agenda details..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Link (Optional)</label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="https://meet.google.com/..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">End Time</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            >
                                <option value="general">General</option>
                                <option value="interview">Interview</option>
                            </select>
                        </div>
                        {type === 'interview' && (
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Stage</label>
                                <select
                                    value={stage}
                                    onChange={(e) => setStage(e.target.value as any)}
                                    className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                                >
                                    <option value="screening">Screening</option>
                                    <option value="technical">Technical</option>
                                    <option value="culture">Culture Fit</option>
                                    <option value="offer">Offer</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Notifications</label>
                        <div className="text-xs text-zinc-400 mb-2">
                            Default: 1d, 1h, 30m, 10m, 5m, 2m before.
                        </div>

                        <div className="flex gap-2 mb-2">
                            <input
                                type="number"
                                value={newCustomMinutes}
                                onChange={(e) => setNewCustomMinutes(e.target.value)}
                                placeholder="Add custom (mins)"
                                className="flex-1 rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={addCustomReminder}
                                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                                Add
                            </button>
                        </div>

                        {customReminders.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {customReminders.map(mins => (
                                    <span key={mins} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
                                        {mins}m
                                        <button onClick={() => removeCustomReminder(mins)} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        disabled={isPending || !title.trim() || !startTime || !endTime}
                        onClick={handleCreate}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span>Create Meeting</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
