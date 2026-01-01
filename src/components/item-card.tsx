'use client';

import { items } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { toggleFavorite, updateStatus, deleteItem, trackItemView } from '@/app/actions';
import { useState } from 'react';
import { Bell, Archive, Star, Pencil, FileText, BookOpen, Trash2, RotateCcw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TagBadge } from '@/components/tag-badge';
import { useHaptic } from '@/hooks/use-haptic';
import { toast } from 'sonner';

const ConfirmDialog = dynamic(() => import('@/components/confirm-dialog').then(mod => mod.ConfirmDialog), { ssr: false });
const ReminderScheduler = dynamic(() => import('@/components/reminder-scheduler').then(mod => mod.ReminderScheduler), { ssr: false });
const EditItemDialog = dynamic(() => import('@/components/edit-item-dialog').then(mod => mod.EditItemDialog), { ssr: false });

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
    const [imageError, setImageError] = useState(false);
    const { trigger: haptic } = useHaptic();

    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic('impact');
        setIsPending(true);
        try {
            await toggleFavorite(item.id, !item.isFavorite);
            toast.success(item.isFavorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            toast.error('Failed to update favorite');
        } finally {
            setIsPending(false);
        }
    };

    const handleArchive = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic('impact');
        setIsPending(true);
        const newStatus = item.status === 'archived' ? 'inbox' : 'archived';
        try {
            await updateStatus(item.id, newStatus);
            toast.success(newStatus === 'archived' ? 'Archived' : 'Restored to inbox');
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsPending(false);
        }
    };

    const handleDeleteCallback = async () => {
        setShowDeleteConfirm(false);
        setIsPending(true);
        try {
            if (item.status === 'trash') {
                await deleteItem(item.id);
                toast.success('Deleted permanently');
            } else {
                await updateStatus(item.id, 'trash');
                toast.success('Moved to trash');
            }
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setIsPending(false);
        }
    };

    const handleRestore = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPending(true);
        try {
            await updateStatus(item.id, 'inbox');
            toast.success('Restored to inbox');
        } catch (error) {
            toast.error('Failed to restore');
        } finally {
            setIsPending(false);
        }
    };

    const handleTrackView = () => {
        trackItemView(item.id);
    };

    return (
        <>
            <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isPending ? 'opacity-50 pointer-events-none' : ''
                } ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl'
                } bg-white dark:bg-zinc-900`}>

                {/* Image Section */}
                {item.image && !imageError && (
                    <div className="relative w-full aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
                        <img
                            src={item.image}
                            alt={item.title || 'Item image'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Selection Checkbox */}
                        {onToggleSelection && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    haptic('selection');
                                    onToggleSelection();
                                }}
                                className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${isSelected
                                        ? 'bg-blue-600 border-blue-600 scale-110'
                                        : 'bg-white/90 border-white/50 backdrop-blur-sm hover:bg-white hover:border-white hover:scale-110'
                                    }`}
                            >
                                {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {/* Status Badges */}
                        <div className="absolute top-3 right-3 flex gap-2">
                            {item.type === 'video' && (
                                <div className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                    </svg>
                                    Video
                                </div>
                            )}
                            {item.reminderAt && new Date(item.reminderAt) > new Date() && (
                                <div className="px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-sm text-white text-xs font-medium">
                                    <Bell className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {item.favicon ? (
                                <img
                                    src={item.favicon}
                                    alt=""
                                    className="w-4 h-4 rounded-sm shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 shrink-0" />
                            )}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Quick Favorite */}
                        <button
                            onClick={handleFavorite}
                            className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${item.isFavorite
                                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {/* Title */}
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleTrackView}
                        className="group/link block mb-2"
                    >
                        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                            {item.title || 'Untitled Link'}
                        </h3>
                    </a>

                    {/* Description */}
                    {item.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                            {item.description}
                        </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.tags.slice(0, 3).map(tag => (
                                <TagBadge key={tag.id} tag={tag} />
                            ))}
                            {item.tags.length > 3 && (
                                <span className="px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                    +{item.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Notes Preview */}
                    {item.notes && item.notes.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {item.notes.slice(0, 1).map(note => (
                                <Link
                                    key={note.id}
                                    href={`/notes/${note.id}`}
                                    className="block p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group/note"
                                >
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {note.title && (
                                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate mb-0.5">
                                                    {note.title}
                                                </div>
                                            )}
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                                                {note.content}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {item.notes.length > 1 && (
                                <Link
                                    href={`/notes?itemId=${item.id}`}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-1"
                                >
                                    View {item.notes.length - 1} more note{item.notes.length > 2 ? 's' : ''}
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-1 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => setShowEditDialog(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                            onClick={() => setShowReminderDialog(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item.reminderAt
                                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">Remind</span>
                        </button>

                        {item.content && (
                            <Link
                                href={`/reader/${item.id}`}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span className="hidden sm:inline">Read</span>
                            </Link>
                        )}

                        {item.status === 'trash' ? (
                            <button
                                onClick={handleRestore}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">Restore</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleArchive}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item.status === 'archived'
                                        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <Archive className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowDeleteConfirm(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>
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

            {showReminderDialog && (
                <ReminderScheduler itemId={item.id} onClose={() => setShowReminderDialog(false)} />
            )}

            {showEditDialog && (
                <EditItemDialog item={item} onClose={() => setShowEditDialog(false)} />
            )}
        </>
    );
}
