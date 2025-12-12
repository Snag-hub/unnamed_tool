'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

export function SearchFilterBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm) {
                params.set('search', searchTerm);
            } else {
                params.delete('search');
            }

            // Only update if value changed to avoid loops (though router.replace usually handles this, careful with deps)
            if (params.get('search') !== searchParams.get('search')) {
                params.set('page', '1');
                startTransition(() => {
                    replace(`${pathname}?${params.toString()}`);
                });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, pathname, replace, searchParams]); // searchParams in dep array might cause loop if referentially unstable.
    // Actually, use searchParams.toString() or similar if needed. But usually Next.js searchParams is stable enough or we ignore it.
    // Let's rely on the check `params.get('search') !== searchParams.get('search')` to break loops.

    const handleTypeFilter = (type: 'all' | 'article' | 'video') => {
        const params = new URLSearchParams(searchParams);
        if (type === 'all') {
            params.delete('type');
        } else {
            params.set('type', type);
        }
        params.set('page', '1');

        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    };

    const currentType = searchParams.get('type') || 'all';

    return (
        <div className="mb-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                    placeholder="Search by title or URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isPending && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2">
                {(['all', 'article', 'video'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => handleTypeFilter(type)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${currentType === type
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-md'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );
}
