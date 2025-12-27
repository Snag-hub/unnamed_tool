import { getItem } from '@/app/actions';
import { notFound } from 'next/navigation';
import { BookOpen, Calendar, User, CornerUpLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await getItem(id);

    if (!item || !item.content) {
        notFound();
    }

    // Narrowing for TypeScript
    const content = item.content;
    const title = item.title || item.url;
    const author = item.author;
    const createdAt = item.createdAt;
    const siteName = item.siteName;
    const favicon = item.favicon;
    const url = item.url;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                    <Link
                        href="/inbox"
                        className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                    >
                        <CornerUpLeft className="h-4 w-4" />
                        Back to Inbox
                    </Link>
                    <div className="flex items-center gap-4">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            View Original
                        </a>
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="mx-auto max-w-3xl px-4 py-8 sm:py-16">
                <header className="mb-12">
                    {siteName && (
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {favicon && (
                                <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />
                            )}
                            {siteName}
                        </div>
                    )}
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
                        {title}
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                        {author && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {author}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Reading Mode
                        </div>
                    </div>
                </header>

                <div
                    className="prose prose-zinc lg:prose-xl dark:prose-invert max-w-none
                        prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400
                        prose-img:rounded-2xl prose-img:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                        End of article. <Link href="/inbox" className="text-blue-600 hover:underline dark:text-blue-400">Return to list</Link>.
                    </p>
                </footer>
            </article>
        </div>
    );
}
