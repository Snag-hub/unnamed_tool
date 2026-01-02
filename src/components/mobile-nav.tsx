'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Star, Archive, Settings, CheckSquare, Calendar, MoreHorizontal, X, Trash2, Clock, FileText, Hash } from 'lucide-react';
import { useState } from 'react';
import { SearchTrigger } from '@/components/search-trigger';

const navItems = [
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/meetings', label: 'Meetings', icon: Calendar },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/tags', label: 'Tags', icon: Hash },
    { href: '/favorites', label: 'Favorites', icon: Star },
    { href: '/archive', label: 'Archive', icon: Archive },
    { href: '/trash', label: 'Trash', icon: Trash2 },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Visible items (4 slots + More = 5 total)
    const visibleItems = navItems.slice(0, 4);
    // All items for the drawer/sidebar
    const allItems = navItems;

    return (
        <>
            {/* Sidebar Drawer */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMoreOpen(false)}
                    />

                    {/* Sidebar */}
                    <aside className="absolute top-0 right-0 bottom-0 w-64 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 pb-20 animate-in slide-in-from-right duration-300 overflow-y-auto scrollbar-hide">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Menu</h2>
                            <button
                                onClick={() => setIsMoreOpen(false)}
                                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <SearchTrigger className="w-full" />
                        </div>

                        <div className="space-y-2">
                            {allItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer / Extra info could go here */}
                    </aside>
                </div>
            )}

            {/* Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t-0 pb-safe z-50">
                <nav className="flex justify-around items-center h-16">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMoreOpen(false)}
                                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${isActive
                                    ? "text-blue-600 dark:text-blue-500"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${isMoreOpen
                            ? "text-blue-600 dark:text-blue-500"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                    >
                        <MoreHorizontal className="w-6 h-6" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>
            </div>
        </>
    );
}
