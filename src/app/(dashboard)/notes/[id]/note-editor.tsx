'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/markdown-editor';
import { createNote, updateNote, deleteNote } from '@/app/note-actions';
import { ArrowLeft, Save, Trash2, Link2, X } from 'lucide-react';
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

type NoteEditorProps = {
    note: Note | null;
};

export default function NoteEditor({ note }: NoteEditorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Get attachment from URL params (for creating attached notes)
    const attachTaskId = searchParams.get('taskId');
    const attachMeetingId = searchParams.get('meetingId');
    const attachItemId = searchParams.get('itemId');

    // Determine attachment type
    const getAttachmentType = () => {
        if (note?.taskId || attachTaskId) return 'Task';
        if (note?.meetingId || attachMeetingId) return 'Meeting';
        if (note?.itemId || attachItemId) return 'Article';
        return null;
    };

    const attachmentType = getAttachmentType();

    // Track changes
    useEffect(() => {
        if (note) {
            const titleChanged = title !== (note.title || '');
            const contentChanged = content !== note.content;
            setHasChanges(titleChanged || contentChanged);
        } else {
            setHasChanges(title.length > 0 || content.length > 0);
        }
    }, [title, content, note]);

    // Auto-save (debounced)
    useEffect(() => {
        if (!hasChanges || !note) return;

        const timeout = setTimeout(async () => {
            await handleSave();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [title, content, hasChanges, note]);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            if (note) {
                // Update existing note
                await updateNote(note.id, {
                    title: title || undefined,
                    content,
                });
            } else {
                // Create new note with optional attachment
                const noteId = await createNote({
                    title: title || undefined,
                    content,
                    taskId: attachTaskId || undefined,
                    meetingId: attachMeetingId || undefined,
                    itemId: attachItemId || undefined,
                });
                router.push(`/notes/${noteId}`);
            }
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!note) return;
        if (!confirm('Are you sure you want to delete this note?')) return;

        setIsDeleting(true);
        try {
            await deleteNote(note.id);
            router.push('/notes');
        } catch (error) {
            console.error('Failed to delete note:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Link
                            href="/notes"
                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled Note"
                            className="flex-1 text-xl font-semibold bg-transparent border-none outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <span className="text-sm text-zinc-500">Unsaved changes</span>
                        )}
                        {isSaving && (
                            <span className="text-sm text-blue-600">Saving...</span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !content.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        {note && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Attachment Badge */}
                {attachmentType && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            Attached to {attachmentType}
                        </span>
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Start writing your note..."
                    autoFocus={!note}
                />
            </div>
        </div>
    );
}
