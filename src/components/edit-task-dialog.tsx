'use client';

import { updateTask } from '@/app/task-actions';
import { useState } from 'react';
import { tasks } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';

type Task = InferSelectModel<typeof tasks>;

interface EditTaskDialogProps {
    task: Task;
    onClose: () => void;
}

export function EditTaskDialog({ task, onClose }: EditTaskDialogProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [type, setType] = useState<'personal' | 'work'>(task.type as 'personal' | 'work');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority as 'low' | 'medium' | 'high');

    // Format Date for datetime-local
    const formatDateForInput = (date: Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [dueDate, setDueDate] = useState(formatDateForInput(task.dueDate));
    const [isPending, setIsPending] = useState(false);

    const handleUpdate = async () => {
        if (!title.trim()) return;

        setIsPending(true);
        try {
            await updateTask(task.id, {
                title,
                description,
                type,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update task');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                <div className="relative bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Edit Task</h3>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Title</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Description</label>
                        <textarea
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            >
                                <option value="personal">Personal</option>
                                <option value="work">Work</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Due Date</label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={isPending || !title.trim()}
                        onClick={handleUpdate}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
