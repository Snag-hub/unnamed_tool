'use client';

import { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag } from '@/app/tag-actions';
import { Plus, Trash2, Tag as TagIcon, Hash, Loader2 } from 'lucide-react';
import { TagBadge } from '@/components/tag-badge';

const COLORS = [
    { name: 'Gray', value: '#71717A' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Pink', value: '#EC4899' },
];

export default function TagsPage() {
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

    const loadTags = async () => {
        setIsLoading(true);
        try {
            const data = await getTags();
            setTags(data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTags();
    }, []);

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim() || isCreating) return;

        setIsCreating(true);
        try {
            await createTag({ name: newTagName.trim(), color: selectedColor });
            setNewTagName('');
            await loadTags();
        } catch (error) {
            console.error('Failed to create tag:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTag = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tag? It will be removed from all items.')) return;

        try {
            await deleteTag(id);
            await loadTags();
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    return (
        <main className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Tags</h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Manage your global categories
                </p>
            </div>

            {/* Create Tag Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-500" />
                    Create New Tag
                </h2>
                <form onSubmit={handleCreateTag} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 px-1">
                                Tag Name
                            </label>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Environment, Personal, Urgent..."
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="sm:w-64">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 px-1">
                                Pick a Color
                            </label>
                            <div className="flex flex-wrap gap-2 p-1">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setSelectedColor(color.value)}
                                        style={{ backgroundColor: color.value }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-blue-500 scale-110 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-700 hover:scale-105'
                                            }`}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!newTagName.trim() || isCreating}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isCreating ? 'Creating...' : 'Add Tag'}
                    </button>
                </form>
            </div>

            {/* Tags Table/Grid */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                    <h3 className="font-bold text-zinc-900 dark:text-white">Global Tags</h3>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {isLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm text-zinc-500">Loading your tags...</p>
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="p-12 text-center">
                            <Hash className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
                            <p className="text-zinc-500">You haven't created any tags yet.</p>
                        </div>
                    ) : (
                        tags.map((tag) => (
                            <div key={tag.id} className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <TagBadge tag={tag} />
                                    <span className="text-xs text-zinc-400 font-medium">Used in 0 items</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
