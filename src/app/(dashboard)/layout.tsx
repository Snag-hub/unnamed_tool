'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-[100dvh] bg-zinc-50 dark:bg-black overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 h-full relative">

                {/* Mobile Header - Permanently visible at top */}
                <header className="md:hidden flex-none flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-20">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/icon-192.png"
                            alt="DayOS"
                            width={28}
                            height={28}
                            className="rounded-lg"
                        />
                        <span className="font-bold text-lg text-zinc-900 dark:text-white">DayOS</span>
                    </div>
                    <UserButton />
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 pb-20 md:pb-0 scroll-smooth">
                    {children}
                </main>
            </div>

            {/* Bottom Navigation for Mobile */}
            <MobileNav />
        </div>
    );
}
