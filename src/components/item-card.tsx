'use client';

import { items } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { toggleFavorite, updateStatus } from '@/app/actions';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ReminderScheduler } from '@/components/reminder-scheduler';

type Item = InferSelectModel<typeof items>;

export function ItemCard({ item }: { item: Item }) {
    const [isPending, setIsPending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);

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
        await updateStatus(item.id, 'trash');
        setIsPending(false);
    };

    return (
        <>
            <div className={`group relative flex flex-row sm:flex-col overflow-hidden rounded-xl bg-white border border-zinc-200 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 ${isPending ? 'opacity-50 pointer-events-none' : ''} h-32 sm:h-auto`}>

                {/* Image Section */}
                {item.image && (
                    <div className="relative w-32 shrink-0 sm:w-full sm:h-auto sm:aspect-video bg-zinc-100 dark:bg-zinc-800">
                        <img
                            src={item.image}
                            alt={item.title || 'Item image'}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Badges - visible on desktop, hidden/smaller on mobile if needed */}
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
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] sm:max-w-none">
                                {item.siteName || new URL(item.url).hostname}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm sm:text-base font-semibold leading-tight text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400 line-clamp-2 sm:line-clamp-none"
                        >
                            {item.title || item.url}
                        </a>

                        {item.description && (
                            <p className="mt-1 hidden sm:block line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Actions - Compact on mobile */}
                    <div className="mt-1 flex items-center justify-end gap-1 sm:gap-2 sm:mt-auto sm:pt-2">
                        <button
                            onClick={handleFavorite}
                            className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                        >
                            <StarIcon filled={item.isFavorite} className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        <button
                            onClick={() => setShowReminderDialog(true)}
                            className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.reminderAt ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                        >
                            <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        <button
                            onClick={handleArchive}
                            className={`rounded-full p-1.5 sm:p-2 transition-colors ${item.status === 'archived' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
                        >
                            <ArchiveIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

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
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Move to Trash?"
                description="This item will be moved to trash. You can restore it later if needed."
                confirmText="Move to Trash"
                variant="danger"
                onConfirm={handleDeleteCallback}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Redesigned Reminder Dialog - "Scheduler" */}
            {showReminderDialog && (
                <ReminderScheduler itemId={item.id} onClose={() => setShowReminderDialog(false)} />
            )}
        </>
    );
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
