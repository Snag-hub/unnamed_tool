'use client';

import { items } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { toggleFavorite, updateStatus, deleteItem, trackItemView } from '@/app/actions';
import { useState } from 'react';
import { RefreshCcw, Bell, Archive as ArchiveIconLucide, Star as StarIconLucide, Pencil as PencilIconLucide, FileText, BookOpen } from 'lucide-react';
import Link from 'next/link';
// Actually the existing code uses custom SVG components (PencilIcon, etc) at bottom. 
// I will import deleteItem and use existing pattern or imported icons. 
// Let's use deleteItem from actions.
import dynamic from 'next/dynamic';
import { TagBadge } from '@/components/tag-badge';
import { motion } from 'framer-motion';
import { useHaptic } from '@/hooks/use-haptic';

const ConfirmDialog = dynamic(() => import('@/components/confirm-dialog').then(mod => mod.ConfirmDialog), {
    ssr: false,
});
const ReminderScheduler = dynamic(() => import('@/components/reminder-scheduler').then(mod => mod.ReminderScheduler), {
    ssr: false,
});
const EditItemDialog = dynamic(() => import('@/components/edit-item-dialog').then(mod => mod.EditItemDialog), {
    ssr: false,
});

type Item = InferSelectModel<typeof items> & {
    notes?: any[];
    tags?: any[];
};

export function ItemCard({
    item,
    isSelected,
    onToggleSelection
}: {
    item: Item;
    isSelected?: boolean;
    onToggleSelection?: () => void;
}) {
    const [isPending, setIsPending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPending(true);
        await toggleFavorite(item.id, !item.isFavorite);
        setIsPending(false);
    };

    const handleArchive = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPending(true);
        const newStatus = item.status === 'archived' ? 'inbox' : 'archived';
        await updateStatus(item.id, newStatus);
        setIsPending(false);
    };

    const handleDeleteCallback = async () => {
        setShowDeleteConfirm(false);
        setIsPending(true);
        if (item.status === 'trash') {
            await deleteItem(item.id);
        } else {
            await updateStatus(item.id, 'trash');
        }
        setIsPending(false);
    };

    const handleRestore = async () => {
        setIsPending(true);
        await updateStatus(item.id, 'inbox');
        setIsPending(false);
    };

    const { trigger: haptic } = useHaptic();



    return (
        <>
            <div className="relative group touch-pan-y h-full">

                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                    className={`group relative flex flex-row sm:flex-col overflow-hidden rounded-xl bg-white border border-zinc-200 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 ${isPending ? 'opacity-50 pointer-events-none' : ''} min-h-[8rem] sm:h-auto z-10 touch-pan-y`}
                >
                    {/* Image Section */}
                    {item.image && (
                        <div className="relative w-32 shrink-0 sm:w-full sm:h-auto sm:aspect-video bg-zinc-100 dark:bg-zinc-800">
                            <img
                                src={item.image}
                                alt={item.title || 'Item image'}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Selection Overlay */}
                            <div
                                onClick={(e) => {
                                    e.preventDefault();
                                    haptic('selection');
                                    onToggleSelection?.();
                                }}
                                // Mobile: always visible/accessible (opacity-100). Desktop: hover (sm:opacity-0 sm:group-hover:opacity-100)
                                className={`absolute top-2 left-2 z-10 h-5 w-5 rounded border transition-all cursor-pointer flex items-center justify-center ${isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white/50 border-zinc-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:bg-zinc-900/50 dark:border-zinc-700'
                                    }`}
                            >
                                {isSelected && (
                                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="absolute bottom-2 right-2 hidden sm:flex gap-1">
                                {item.type === 'video' && (
                                    <div className="rounded bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                        Video
                                    </div>
                                )}
                                {item.reminderAt && new Date(item.reminderAt) > new Date() && (
                                    <div className="rounded bg-blue-600/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1">
                                        <BellIcon className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 overflow-hidden">
                        <div>
                            <div className="mb-1 sm:mb-2 flex items-center gap-2">
                                {item.favicon ? (
                                    <img
                                        src={item.favicon}
                                        alt=""
                                        className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
                                )}
                                <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackItemView(item.id)}
                                className="block text-sm sm:text-base font-semibold leading-tight text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400 line-clamp-2"
                            >
                                {item.title || item.url}
                            </a>

                            {item.description && (
                                <p className="mt-1 hidden sm:block line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    {item.description}
                                </p>
                            )}

                            {/* Tags */}
                            {item.tags && item.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {item.tags.map(tag => (
                                        <TagBadge key={tag.id} tag={tag} />
                                    ))}
                                </div>
                            )}

                            {/* Notes Preview */}
                            {item.notes && item.notes.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {item.notes.slice(0, 1).map(note => (
                                        <Link
                                            key={note.id}
                                            href={`/notes/${note.id}`}
                                            className="group/note block p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        >
                                            <div className="flex items-start gap-2">
                                                <FileText className="w-3 h-3 mt-0.5 text-blue-500" />
                                                <div className="flex-1 min-w-0">
                                                    {note.title && (
                                                        <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 truncate mb-0.5">
                                                            {note.title}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-1 italic">
                                                        {note.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {item.notes.length > 1 && (
                                        <Link href={`/notes?itemId=${item.id}`} className="text-[10px] text-zinc-400 hover:text-blue-500 font-medium px-1 transition-colors">
                                            + {item.notes.length - 1} more notes
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions - Compact on mobile */}
                        <div className="mt-auto flex items-center justify-between sm:justify-end gap-0.5 sm:gap-2 pt-2">
                            <button
                                onClick={handleFavorite}
                                className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                            >
                                <StarIcon filled={item.isFavorite} className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            <button
                                onClick={() => setShowEditDialog(true)}
                                className="rounded-full p-1.5 sm:p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                            >
                                <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            <button
                                onClick={() => setShowReminderDialog(true)}
                                className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.reminderAt ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                            >
                                <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            {item.content && (
                                <Link
                                    href={`/reader/${item.id}`}
                                    className="rounded-full p-1.5 sm:p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Read Article"
                                >
                                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Link>
                            )}

                            <div className="flex-1 sm:hidden"></div>

                            {item.status === 'trash' ? (
                                <button
                                    onClick={handleRestore}
                                    className="rounded-full p-1.5 sm:p-2 text-zinc-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-colors"
                                    title="Restore"
                                >
                                    <RestoreIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleArchive}
                                    className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.status === 'archived' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                                    title={item.status === 'archived' ? 'Unarchive' : 'Archive'}
                                >
                                    <ArchiveIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowDeleteConfirm(true);
                                }}
                                className="rounded-full p-1.5 sm:p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                                <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>
                    </div>

                </motion.div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={item.status === 'trash' ? "Delete Permanently?" : "Move to Trash?"}
                description={item.status === 'trash' ? "This action cannot be undone." : "This item will be moved to trash. You can restore it later if needed."}
                confirmText={item.status === 'trash' ? "Delete Forever" : "Move to Trash"}
                variant="danger"
                onConfirm={handleDeleteCallback}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Redesigned Reminder Dialog - "Scheduler" */}
            {showReminderDialog && (
                <ReminderScheduler itemId={item.id} onClose={() => setShowReminderDialog(false)} />
            )}

            {/* Edit Dialog */}
            {showEditDialog && (
                <EditItemDialog item={item} onClose={() => setShowEditDialog(false)} />
            )}
        </>
    );
}

function PencilIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    )
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    )
}

function StarIcon({ className, filled }: { className?: string, filled?: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    )
}

function ArchiveIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 16.5h3.75m-12-8.25h15.75a1.5 1.5 0 011.5 1.5v2.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5V9.75a1.5 1.5 0 011.5-1.5z" />
        </svg>
    )
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

function RestoreIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
    )
}
