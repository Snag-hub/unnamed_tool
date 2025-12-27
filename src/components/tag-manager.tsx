'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Tag as TagIcon, Hash } from 'lucide-react';
import { createTag, getTags } from '@/app/tag-actions';

interface Tag {
    id: string;
    name: string;
    color: string | null;
}

export function TagManager({
    selectedTags,
    onToggleTag
}: {
    selectedTags: string[];
    onToggleTag: (tagId: string) => void
}) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        const fetchedTags = await getTags();
        setTags(fetchedTags);
        setIsLoading(false);
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const newTag = await createTag({ name: newTagName });
            setTags(prev => [...prev, newTag]);
            setNewTagName('');
            setShowNewTagInput(false);
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    };

    if (isLoading) return <div className="h-20 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-lg" />;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => onToggleTag(tag.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag.id)
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
                            }`}
                        style={selectedTags.includes(tag.id) ? {} : { borderColor: tag.color || undefined }}
                    >
                        <Hash className="h-3 w-3" />
                        {tag.name}
                    </button>
                ))}

                <button
                    onClick={() => setShowNewTagInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
                >
                    <Plus className="h-3 w-3" />
                    New Tag
                </button>
            </div>

            {showNewTagInput && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 animate-in slide-in-from-top-2">
                    <input
                        autoFocus
                        placeholder="Tag name..."
                        className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-zinc-100"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTag();
                            if (e.key === 'Escape') setShowNewTagInput(false);
                        }}
                    />
                    <button
                        onClick={handleCreateTag}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => setShowNewTagInput(false)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
