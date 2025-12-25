'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarkdownEditor } from '@/components/markdown-editor';
import { createNote, updateNote, deleteNote, getAttachmentTargets } from '@/app/note-actions';
import { ArrowLeft, Save, Trash2, Link2, X, CheckSquare, Calendar, BookOpen, ChevronRight, Plus } from 'lucide-react';
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

    // Attachment State
    const [taskId, setTaskId] = useState(note?.taskId || searchParams.get('taskId') || null);
    const [meetingId, setMeetingId] = useState(note?.meetingId || searchParams.get('meetingId') || null);
    const [itemId, setItemId] = useState(note?.itemId || searchParams.get('itemId') || null);

    const [showSelector, setShowSelector] = useState(false);
    const [targets, setTargets] = useState<{
        tasks: any[];
        meetings: any[];
        items: any[];
    } | null>(null);

    // Fetch targets when selector opens
    useEffect(() => {
        if (showSelector && !targets) {
            getAttachmentTargets().then(setTargets);
        }
    }, [showSelector, targets]);

    // Determine attachment type
    const getAttachmentType = () => {
        if (taskId) return 'Task';
        if (meetingId) return 'Meeting';
        if (itemId) return 'Article';
        return null;
    };

    const attachmentType = getAttachmentType();

    // Track changes
    useEffect(() => {
        const titleChanged = title !== (note?.title || '');
        const contentChanged = content !== (note?.content || '');
        const taskChanged = taskId !== (note?.taskId || null);
        const meetingChanged = meetingId !== (note?.meetingId || null);
        const itemChanged = itemId !== (note?.itemId || null);

        setHasChanges(titleChanged || contentChanged || taskChanged || meetingChanged || itemChanged);
    }, [title, content, taskId, meetingId, itemId, note]);

    // Auto-save (debounced)
    useEffect(() => {
        if (!hasChanges || !note) return;

        const timeout = setTimeout(async () => {
            await handleSave();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [title, content, taskId, meetingId, itemId, hasChanges, note]);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const data = {
                title: title || undefined,
                content,
                taskId: taskId || null,
                meetingId: meetingId || null,
                itemId: itemId || null,
            };

            if (note) {
                await updateNote(note.id, data);
            } else {
                const noteId = await createNote(data);
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

    const handleSelectTarget = (type: 'task' | 'meeting' | 'item', id: string) => {
        // Reset others
        setTaskId(type === 'task' ? id : null);
        setMeetingId(type === 'meeting' ? id : null);
        setItemId(type === 'item' ? id : null);
        setShowSelector(false);
    };

    const handleRemoveAttachment = () => {
        setTaskId(null);
        setMeetingId(null);
        setItemId(null);
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="flex flex-col gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Link
                            href="/notes"
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled Note"
                            className="flex-1 text-lg sm:text-xl font-semibold bg-transparent border-none outline-none min-w-0 truncate"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {(hasChanges || isSaving) && (
                            <span className="text-[10px] sm:text-sm text-zinc-500 hidden xs:block">
                                {isSaving ? 'Saving...' : 'Unsaved changes'}
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !content.trim()}
                            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            title="Save Note"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Save</span>
                        </button>
                        {note && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                                title="Delete Note"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Attachment Section */}
                <div className="flex items-center gap-2">
                    {attachmentType ? (
                        <div className="flex items-center gap-2 group">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Attached to {attachmentType}
                                </span>
                                <button
                                    onClick={handleRemoveAttachment}
                                    className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                                    title="Remove Attachment"
                                >
                                    <X className="w-3 h-3 text-blue-500" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowSelector(!showSelector)}
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSelector(!showSelector)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors"
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            Attach to Task, Meeting or Item
                        </button>
                    )}
                </div>
            </div>

            {/* Attachment Selector Dropdown */}
            {showSelector && (
                <div className="absolute top-32 left-4 right-4 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-w-sm">
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-sm font-semibold">Select Attachment</span>
                        <button onClick={() => setShowSelector(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2 space-y-4">
                        {/* Tasks */}
                        {targets?.tasks?.length ? (
                            <div>
                                <h4 className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3" /> Recent Tasks
                                </h4>
                                <div className="space-y-0.5">
                                    {targets.tasks.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleSelectTarget('task', t.id)}
                                            className="w-full text-left px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between group"
                                        >
                                            <span className="truncate flex-1">{t.title}</span>
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Meetings */}
                        {targets?.meetings?.length ? (
                            <div>
                                <h4 className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Recent Meetings
                                </h4>
                                <div className="space-y-0.5">
                                    {targets.meetings.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => handleSelectTarget('meeting', m.id)}
                                            className="w-full text-left px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between group"
                                        >
                                            <span className="truncate flex-1">{m.title}</span>
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Items */}
                        {targets?.items?.length ? (
                            <div>
                                <h4 className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" /> Recent Articles
                                </h4>
                                <div className="space-y-0.5">
                                    {targets.items.map(i => (
                                        <button
                                            key={i.id}
                                            onClick={() => handleSelectTarget('item', i.id)}
                                            className="w-full text-left px-2 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between group"
                                        >
                                            <span className="truncate flex-1">{i.title || i.url}</span>
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {!targets && (
                            <div className="py-8 text-center text-zinc-400 text-xs">
                                Loading recent items...
                            </div>
                        )}
                        {targets && !targets.tasks.length && !targets.meetings.length && !targets.items.length && (
                            <div className="py-8 text-center text-zinc-400 text-xs text-balance">
                                No recent tasks, meetings or articles found to attach.
                            </div>
                        )}
                    </div>
                </div>
            )}

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
