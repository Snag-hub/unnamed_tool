'use client';

import { Search } from 'lucide-react';

export function SearchTrigger({
    className = "",
    variant = "default"
}: {
    className?: string;
    variant?: "default" | "compact";
}) {
    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('open-omnisearch'));
    };

    if (variant === "compact") {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`p-2 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all relative z-40 cursor-pointer ${className}`}
                title="Search (⌘K)"
            >
                <Search className="h-5 w-5" />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-2 group transition-all w-full cursor-pointer ${className}`}
        >
            <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <div
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-sm text-zinc-500 dark:text-zinc-400 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-all cursor-text shadow-sm"
                >
                    Search...
                </div>
                <div className="hidden sm:flex absolute right-2 items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-medium text-zinc-400">
                    <span className="text-[8px]">⌘</span>K
                </div>
            </div>
        </button>
    );
}
