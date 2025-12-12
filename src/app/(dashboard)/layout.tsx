'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-black">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-auto md:ml-64 transition-all duration-300">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        type="button"
                        className="-ml-2 p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="ml-2 font-bold text-lg text-zinc-900 dark:text-white">Read Later</div>
                </div>

                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
