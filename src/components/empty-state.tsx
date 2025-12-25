import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
                {description}
            </p>

            {actionLabel && (actionLink || onAction) && (
                actionLink ? (
                    <Link
                        href={actionLink}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    );
}
