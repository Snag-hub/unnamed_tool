"use client";

import { Chrome, Download } from "lucide-react";
import { useState } from "react";
import { ExtensionModal } from "./extension-modal";

export function ChromeExtensionLink() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
                <Download className="w-4 h-4" />
                Get for Chrome
            </button>
            <ExtensionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

