'use client';

import { useEffect, useRef } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';

interface ExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExtensionModal({ isOpen, onClose }: ExtensionModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div
                ref={modalRef}
                className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
                role="dialog"
                aria-modal="true"
            >
                <div className="relative p-8 md:p-12">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <AlertCircle className="h-8 w-8" />
                    </div>

                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
                        Honestly?
                    </h3>

                    <div className="space-y-4 text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        <p>
                            I don't have the spare $5 Google wants for a developer account right now. 😂 😂
                        </p>
                        <p>
                            But you can still use it! The "Edge" version is compatible with Chrome. Just download the zip and follow the manual guide.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <a
                            href="/dayos-extension-chromium.zip"
                            download
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95"
                            onClick={onClose}
                        >
                            <Download className="w-4 h-4" />
                            Download Zip
                        </a>
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
