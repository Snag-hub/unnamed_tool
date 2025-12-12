'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/clerk-buttons';
import { Inbox, Star, Archive, Trash2, Settings, X } from 'lucide-react';

const navigation = [
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Archive', href: '/archive', icon: Archive },
    { name: 'Trash', href: '/trash', icon: Trash2 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const sidebarContent = (
        <div className="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-white">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        R
                    </div>
                    <span>Read Later</span>
                </Link>
                {/* Mobile Close Button */}
                <button
                    type="button"
                    className="md:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={onClose}
                >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose} // Close sidebar on mobile when navigating
                            className={classNames(
                                isActive
                                    ? 'bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-400'
                                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
                                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                            )}
                        >
                            <item.icon
                                className={classNames(
                                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-300',
                                    'mr-3 h-5 w-5 flex-shrink-0'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Sign Out */}
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {/* We could show user info here if we fetch it */}
                    </div>
                    <SignOutButton />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="relative z-50 md:hidden">
                    <div className="fixed inset-0 bg-zinc-900/80" aria-hidden="true" onClick={onClose} />
                    <div className="fixed inset-0 flex">
                        <div className="relative w-full max-w-xs flex-1">
                            {sidebarContent}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

