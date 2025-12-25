'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Calendar, CheckSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';

type Note = {
    id: string;
    title: string | null;
    content: string;
    taskId: string | null;
    meetingId: string | null;
    itemId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

type NotesViewProps = {
    initialNotes: Note[];
    initialSearch?: string;
};

export default function NotesView({ initialNotes, initialSearch }: NotesViewProps) {
    const router = useRouter();
    const [search, setSearch] = useState(initialSearch || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        if (value) {
            router.push(`/notes?search=${encodeURIComponent(value)}`);
        } else {
            router.push('/notes');
        }
    };

    // Get attachment icon
    const getAttachmentIcon = (note: Note) => {
        if (note.taskId) return <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />;
        if (note.meetingId) return <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />;
        if (note.itemId) return <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />;
        return null;
    };

    // Get attachment label
    const getAttachmentLabel = (note: Note) => {
        if (note.taskId) return 'Task';
        if (note.meetingId) return 'Meeting';
        if (note.itemId) return 'Article';
        return 'Standalone';
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Truncate content for preview
    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                            Notes
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            Your knowledge base
                        </p>
                    </div>

                    {/* Create Note Button */}
                    <Link
                        href="/notes/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        New Note
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search notes..."
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {initialNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <FileText className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                            {search ? 'No notes found' : 'No notes yet'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                            {search ? 'Try a different search term' : 'Create your first note to get started'}
                        </p>
                        {!search && (
                            <Link
                                href="/notes/new"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Note
                            </Link>
                        )}
                    </div>
                ) : (
                    initialNotes.map((note) => (
                        <Link
                            key={note.id}
                            href={`/notes/${note.id}`}
                            className="block p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getAttachmentIcon(note)}
                                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                                            {note.title || 'Untitled Note'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                                        {truncateContent(note.content)}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                                        <span>{getAttachmentLabel(note)}</span>
                                        <span>•</span>
                                        <span>{formatDate(note.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
