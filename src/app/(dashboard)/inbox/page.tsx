import { currentUser } from '@clerk/nextjs/server';
import { fetchItems } from '@/app/actions';
import { ItemGrid } from '@/components/item-grid';
import Link from 'next/link';

import { SearchFilterBar } from '@/components/search-filter-bar';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: 'all' | 'article' | 'video' }>;
}) {
  const user = await currentUser();
  const { search, type } = await searchParams; // Next.js 15+ needs await

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-black">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          You need to be signed in to view your inbox.
        </h1>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Go to Home
        </Link>
      </div>
    );
  }

  // Fetch initial items (page 1)
  const { items: initialItems, hasMore } = await fetchItems({
    page: 1,
    limit: 12,
    status: 'inbox',
    search,
    type: type as 'all' | 'article' | 'video',
  });

  return (
    <main className="p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Inbox</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Saved for later
          </p>
        </div>
      </div>

      <SearchFilterBar />

      <ItemGrid
        initialItems={initialItems}
        initialHasMore={hasMore}
        status="inbox"
        search={search}
        type={type as 'all' | 'article' | 'video'}
        emptyTitle={search ? `No results for "${search}"` : "No items yet"}
        emptyDescription={search ? "Try checking your spelling or use different keywords." : "Save some links to get started!"}
      />
    </main>
  );
}
