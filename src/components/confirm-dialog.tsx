'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'default';
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'default',
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <h3 id="dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
