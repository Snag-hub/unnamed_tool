'use client';

import { useState } from 'react';
import { Trash2, Archive, Inbox, X, Loader2 } from 'lucide-react';
import { batchUpdateStatus, batchDeleteItems } from '@/app/actions';

export function SelectionBar({
    selectedIds,
    onClear,
    currentStatus
}: {
    selectedIds: string[];
    onClear: () => void;
    currentStatus?: 'inbox' | 'reading' | 'archived' | 'trash';
}) {
    const [isPending, setIsPending] = useState(false);

    const handleBatchAction = async (action: 'archive' | 'delete' | 'restore' | 'inbox') => {
        setIsPending(true);
        try {
            if (action === 'delete') {
                if (currentStatus === 'trash') {
                    await batchDeleteItems(selectedIds);
                } else {
                    await batchUpdateStatus(selectedIds, 'trash');
                }
            } else if (action === 'archive') {
                await batchUpdateStatus(selectedIds, 'archived');
            } else if (action === 'inbox' || action === 'restore') {
                await batchUpdateStatus(selectedIds, 'inbox');
            }
            onClear();
        } catch (error) {
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-white">
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-800">
                    <button onClick={onClear} className="p-1 hover:bg-zinc-800 rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-bold whitespace-nowrap">
                        {selectedIds.length} items selected
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {currentStatus !== 'inbox' && (
                        <ActionBtn
                            icon={<Inbox className="h-4 w-4" />}
                            label="Move to Inbox"
                            onClick={() => handleBatchAction('inbox')}
                            disabled={isPending}
                        />
                    )}

                    {currentStatus !== 'archived' && (
                        <ActionBtn
                            icon={<Archive className="h-4 w-4" />}
                            label="Archive"
                            onClick={() => handleBatchAction('archive')}
                            disabled={isPending}
                        />
                    )}

                    <ActionBtn
                        icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        label={currentStatus === 'trash' ? "Delete Forever" : "Trash"}
                        onClick={() => handleBatchAction('delete')}
                        disabled={isPending}
                        variant="danger"
                    />
                </div>
            </div>
        </div>
    );
}

function ActionBtn({
    icon,
    label,
    onClick,
    disabled,
    variant = 'default'
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'danger';
}) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${variant === 'danger'
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
                    : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                }`}
            title={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
