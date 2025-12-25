'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Star, Archive, Settings, CheckSquare, Calendar } from 'lucide-react';

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

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t-0 pb-safe z-50">
            <nav className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
            </nav>
        </div>
    );
}
