'use client';

import { updateItem } from '@/app/actions';
import { useState, useEffect } from 'react';
import { TagManager } from '@/components/tag-manager';
import { attachTagToItem, detachTagFromItem } from '@/app/tag-actions';

interface EditItemDialogProps {
    item: {
        id: string;
        title: string | null;
        reminderAt: Date | null;
        tags?: any[];
    };
    onClose: () => void;
}

export function EditItemDialog({ item, onClose }: EditItemDialogProps) {
    const [title, setTitle] = useState(item.title || '');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        item.tags?.map(t => t.id) || []
    );

    // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (date: Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [reminderAt, setReminderAt] = useState(formatDateForInput(item.reminderAt));
    const [isPending, setIsPending] = useState(false);

    const handleToggleTag = async (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(prev => prev.filter(id => id !== tagId));
            await detachTagFromItem(item.id, tagId);
        } else {
            setSelectedTagIds(prev => [...prev, tagId]);
            await attachTagToItem(item.id, tagId);
        }
    };

    const handleSave = async () => {
        setIsPending(true);
        try {
            await updateItem(item.id, {
                title,
                reminderAt: reminderAt ? new Date(reminderAt) : null,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update item');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="relative bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Edit Item</h3>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Title</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Item Title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Tags</label>
                        <TagManager selectedTags={selectedTagIds} onToggleTag={handleToggleTag} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Primary Reminder</label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-lg border-0 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-500 transition-shadow"
                            value={reminderAt}
                            onChange={(e) => setReminderAt(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={isPending}
                        onClick={handleSave}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
