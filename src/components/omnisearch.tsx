'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, CheckCircle, Calendar, Globe, BookOpen, X } from 'lucide-react';
import { globalSearch } from '@/app/actions';
import { useTransition } from 'react';

export function Omnisearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{
        items: any[];
        tasks: any[];
        meetings: any[];
        notes: any[];
    }>({ items: [], tasks: [], meetings: [], notes: [] });
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSearch = useCallback(async (q: string) => {
        if (!q) {
            setResults({ items: [], tasks: [], meetings: [], notes: [] });
            return;
        }

        const data = await globalSearch(q);
        setResults(data);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };

        const toggle = () => setIsOpen(true);
        window.addEventListener('open-omnisearch', toggle);
        document.addEventListener('keydown', down);

        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-omnisearch', toggle);
        };
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query) {
                startTransition(() => {
                    handleSearch(query);
                });
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [query, handleSearch]);

    const navigate = (url: string) => {
        router.push(url);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-[10vh] px-0 sm:px-4">
            <div
                className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm dark:bg-zinc-950/80"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full h-full sm:h-auto sm:max-w-2xl flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-x-0 sm:border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-200 sm:duration-300">
                <div className="flex items-center px-4 py-4 sm:py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <Search className="h-5 w-5 text-zinc-400 mr-3" />
                    <input
                        autoFocus
                        placeholder="Search for anything..."
                        className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsOpen(false);
                        }}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 -mr-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:max-h-[60vh]">
                    {query === '' ? (
                        <div className="py-12 text-center text-zinc-500">
                            <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Type to search for items, tasks, meetings, and notes</p>
                            <p className="text-xs mt-1 text-zinc-400 italic">Shortcut: Cmd+K</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4 px-2">
                            {/* Items Section */}
                            {results.items.length > 0 && (
                                <Section title="Items" icon={<Globe className="h-4 w-4" />}>
                                    {results.items.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            title={item.title || item.url}
                                            subtitle={item.siteName}
                                            icon={item.content ? <BookOpen className="h-4 w-4 text-blue-500" /> : <Globe className="h-4 w-4 text-zinc-400" />}
                                            onClick={() => navigate(item.content ? `/reader/${item.id}` : item.url)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Tasks Section */}
                            {results.tasks.length > 0 && (
                                <Section title="Tasks" icon={<CheckCircle className="h-4 w-4" />}>
                                    {results.tasks.map(task => (
                                        <ResultItem
                                            key={task.id}
                                            title={task.title}
                                            subtitle={task.status}
                                            icon={<CheckCircle className={`h-4 w-4 ${task.status === 'done' ? 'text-green-500' : 'text-zinc-400'}`} />}
                                            onClick={() => navigate('/tasks')}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Meetings Section */}
                            {results.meetings.length > 0 && (
                                <Section title="Meetings" icon={<Calendar className="h-4 w-4" />}>
                                    {results.meetings.map(meeting => (
                                        <ResultItem
                                            key={meeting.id}
                                            title={meeting.title}
                                            subtitle={new Date(meeting.startTime).toLocaleDateString()}
                                            icon={<Calendar className="h-4 w-4 text-zinc-400" />}
                                            onClick={() => navigate('/timeline')}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Notes Section */}
                            {results.notes.length > 0 && (
                                <Section title="Notes" icon={<FileText className="h-4 w-4" />}>
                                    {results.notes.map(note => (
                                        <ResultItem
                                            key={note.id}
                                            title={note.title || 'Untitled Note'}
                                            subtitle={note.content.substring(0, 50) + '...'}
                                            icon={<FileText className="h-4 w-4 text-orange-400" />}
                                            onClick={() => navigate(`/notes/${note.id}`)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {!isPending && results.items.length === 0 && results.tasks.length === 0 && results.meetings.length === 0 && results.notes.length === 0 && (
                                <div className="py-12 text-center text-zinc-500">
                                    <p className="text-sm">No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                {icon}
                {title}
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function ResultItem({ title, subtitle, icon, onClick }: { title: string; subtitle?: string; icon: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
        >
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </div>
                {subtitle && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 capitalize">
                        {subtitle}
                    </div>
                )}
            </div>
        </button>
    );
}
