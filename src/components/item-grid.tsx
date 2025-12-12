'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ItemCard } from '@/components/item-card';
import { fetchItems } from '@/app/actions';
import { items } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { Loader2 } from 'lucide-react';

type Item = InferSelectModel<typeof items>;

interface ItemGridProps {
    initialItems: Item[];
    initialHasMore?: boolean;
    status?: 'inbox' | 'reading' | 'archived' | 'trash';
    isFavorite?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    search?: string;
    type?: 'all' | 'article' | 'video';
}

export function ItemGrid({
    initialItems,
    initialHasMore = false,
    status,
    isFavorite,
    emptyTitle = 'No items found',
    emptyDescription = 'Try adjusting your filters or add some new items.',
    search,
    type,
}: ItemGridProps) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    // Reset state when initialItems change (e.g. filter/search update from parent)
    useEffect(() => {
        setItems(initialItems);
        setPage(1);
        setHasMore(initialHasMore);
        setIsLoading(false);
    }, [initialItems, initialHasMore]);

    useEffect(() => {
        // If we are in view, have more items, and aren't currently loading
        if (inView && hasMore && !isLoading) {
            loadMore();
        }
    }, [inView, hasMore, isLoading]);

    const loadMore = async () => {
        setIsLoading(true);
        const nextPage = page + 1;
        try {
            const res = await fetchItems({
                page: nextPage,
                limit: 12,
                status,
                isFavorite,
                search,
                type,
            });

            if (res.items.length > 0) {
                setItems((prev) => [...prev, ...res.items]);
                setPage(nextPage);
                setHasMore(res.hasMore);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to load more items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-24 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{emptyTitle}</p>
                <p className="text-zinc-500 dark:text-zinc-400">{emptyDescription}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </div>

            {hasMore && (
                <div
                    ref={ref}
                    className="mt-8 flex justify-center py-4"
                >
                    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />}
                </div>
            )}
        </>
    );
}
