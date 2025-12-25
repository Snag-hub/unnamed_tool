'use client';

import { createProject } from '@/app/task-actions';
import { useState } from 'react';

interface CreateProjectDialogProps {
    onClose: () => void;
}

export function CreateProjectDialog({ onClose }: CreateProjectDialogProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6'); // Default blue
    const [isPending, setIsPending] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsPending(true);
        try {
            await createProject(name, color);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create project');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                <div className="relative bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">New Project</h3>
                    <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Project Name</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Work, Personal"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-10 w-12 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{color}</span>
                        </div>
                    </div>

                    <button
                        disabled={isPending || !name.trim()}
                        onClick={handleCreate}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span>Create Project</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
