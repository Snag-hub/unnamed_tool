'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Star, Archive, Settings, CheckSquare, Calendar, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/meetings', label: 'Meetings', icon: Calendar },
    { href: '/favorites', label: 'Favorites', icon: Star },
    { href: '/archive', label: 'Archive', icon: Archive },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Visible items (Max 4 slots: 3 items + More)
    const visibleItems = navItems.slice(0, 3);
    const hiddenItems = navItems.slice(3);

    return (
        <>
            {/* More Menu Overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-50 bg-black/20 dark:bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMoreOpen(false)}>
                    <div
                        className="absolute bottom-20 right-4 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 animate-in slide-in-from-bottom-5 fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {hiddenItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMoreOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
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
                        className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${isMoreOpen || hiddenItems.some(i => i.href === pathname)
                            ? "text-blue-600 dark:text-blue-500"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                    >
                        {isMoreOpen ? <X className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
                        <span className="text-[10px] font-medium">{isMoreOpen ? 'Close' : 'More'}</span>
                    </button>
                </nav>
            </div>
        </>
    );
}
