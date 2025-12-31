'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ItemCard } from '@/components/item-card';
import { fetchItems } from '@/app/actions';
import { items } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { Loader2, Inbox, LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { SelectionBar } from '@/components/selection-bar';
import { PullToRefresh } from '@/components/pull-to-refresh';

type Item = InferSelectModel<typeof items>;

interface ItemGridProps {
    initialItems: Item[];
    initialHasMore?: boolean;
    status?: 'inbox' | 'reading' | 'archived' | 'trash';
    isFavorite?: boolean;
    emptyState?: React.ReactNode;
    search?: string;
    type?: 'all' | 'article' | 'video';
}

export function ItemGrid({
    initialItems,
    initialHasMore = false,
    status,
    isFavorite,
    emptyState,
    search,
    type,
}: ItemGridProps) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    // Reset state when initialItems change
    useEffect(() => {
        setItems(initialItems);
        setPage(1);
        setHasMore(initialHasMore);
        setIsLoading(false);
        setSelectedIds([]);
    }, [initialItems, initialHasMore]);

    useEffect(() => {
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



    return (
        <PullToRefresh onRefresh={async () => {
            // Revalidating items via server action would be better, but refresh is ok
            await new Promise(r => setTimeout(r, 1000));
        }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.includes(item.id)}
                            onToggleSelection={() => toggleSelection(item.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {hasMore && (
                <div
                    ref={ref}
                    className="mt-8 flex justify-center py-4"
                >
                    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />}
                </div>
            )}

            {selectedIds.length > 0 && (
                <SelectionBar
                    selectedIds={selectedIds}
                    onClear={clearSelection}
                    currentStatus={status}
                />
            )}
        </PullToRefresh>
    );
}
