'use client';

import { Hash } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    color: string | null;
}

export function TagBadge({ tag }: { tag: Tag }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
            style={{
                backgroundColor: `${tag.color}15` || '#3B82F615',
                borderColor: `${tag.color}40` || '#3B82F640',
                color: tag.color || '#3B82F6'
            }}
        >
            <Hash className="h-2.5 w-2.5" />
            {tag.name}
        </span>
    );
}
