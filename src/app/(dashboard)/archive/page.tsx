import { currentUser } from '@clerk/nextjs/server';
import { fetchItems } from '@/app/actions';
import { ItemGrid } from '@/components/item-grid';

import { SearchFilterBar } from '@/components/search-filter-bar';

export default async function ArchivePage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; type?: 'all' | 'article' | 'video' }>;
}) {
    const user = await currentUser();
    const { search, type } = await searchParams;

    if (!user) return null;

    const { items: initialItems, hasMore } = await fetchItems({
        page: 1,
        limit: 12,
        status: 'archived',
        search,
        type: type as 'all' | 'article' | 'video',
    });

    return (
        <main className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Archive</h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Items archived
                </p>
            </div>

            <SearchFilterBar />

            <ItemGrid
                initialItems={initialItems}
                initialHasMore={hasMore}
                status="archived"
                search={search}
                type={type as 'all' | 'article' | 'video'}
                emptyTitle={search ? `No results for "${search}"` : "Archive is empty"}
                emptyDescription={search ? "Try checking your spelling or use different keywords." : "Items you archive will appear here."}
            />
        </main>
    );
}
