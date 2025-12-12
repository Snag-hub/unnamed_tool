import { currentUser } from '@clerk/nextjs/server';
import { fetchItems } from '@/app/actions';
import { ItemGrid } from '@/components/item-grid';

import { SearchFilterBar } from '@/components/search-filter-bar';

export default async function FavoritesPage({
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
        isFavorite: true,
        search,
        type: type as 'all' | 'article' | 'video',
    });

    return (
        <main className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Favorites</h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Items marked as favorite
                </p>
            </div>

            <SearchFilterBar />

            <ItemGrid
                initialItems={initialItems}
                initialHasMore={hasMore}
                isFavorite={true}
                search={search}
                type={type as 'all' | 'article' | 'video'}
                emptyTitle={search ? `No results for "${search}"` : "No favorites yet"}
                emptyDescription={search ? "Try checking your spelling or use different keywords." : "Click the star icon on items to add them here."}
            />
        </main>
    );
}
