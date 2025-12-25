'use client';

import { emptyTrash } from '@/app/actions';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from './confirm-dialog';

export function EmptyTrashButton({ isDisabled = false }: { isDisabled?: boolean }) {
    const [isPending, setIsPending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleEmptyCrash = async () => {
        setIsPending(true);
        setShowConfirm(false);
        try {
            await emptyTrash();
        } catch (error) {
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    if (isDisabled) return null;

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-sm font-medium transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                Empty Trash
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Empty Trash?"
                description="This will permanently delete all items in the trash. This action cannot be undone."
                confirmText="Empty Trash"
                variant="danger"
                onConfirm={handleEmptyCrash}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
