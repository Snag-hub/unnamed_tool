import { currentUser } from '@clerk/nextjs/server';
import { fetchItems } from '@/app/actions';
import { ItemGrid } from '@/components/item-grid';

export default async function TrashPage() {
    const user = await currentUser();

    if (!user) return null;

    const { items: initialItems, hasMore } = await fetchItems({
        page: 1,
        limit: 12,
        status: 'trash',
    });

    return (
        <main className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Trash</h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Items in trash
                </p>
            </div>

            <ItemGrid
                initialItems={initialItems}
                initialHasMore={hasMore}
                status="trash"
                emptyTitle="Trash is empty"
                emptyDescription="Items you delete will end up here."
            />
        </main>
    );
}
