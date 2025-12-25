'use client';

import { meetings } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { deleteMeeting } from '@/app/meeting-actions';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { TrashIcon, VideoIcon, FileText } from 'lucide-react';
import Link from 'next/link';

type Meeting = InferSelectModel<typeof meetings> & {
    notes?: any[];
};

export function MeetingCard({ meeting }: { meeting: Meeting }) {
    const [isPending, setIsPending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        await deleteMeeting(meeting.id);
        setIsPending(false);
        setShowDeleteConfirm(false);
    };

    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    const isPast = endTime < new Date();

    return (
        <>
            <div className={`group flex flex-col p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800 ${isPending ? 'opacity-50 pointer-events-none' : ''} ${isPast ? 'opacity-75' : ''}`}>
                <div className="flex items-start gap-4">
                    {/* Time Box */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                        <span className="text-xs font-bold uppercase">{startTime.toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-bold leading-none">{startTime.getDate()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {meeting.title}
                            </h3>
                            {meeting.type === 'interview' && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold uppercase">
                                    Interview
                                </span>
                            )}
                            {meeting.stage && (
                                <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 text-[10px] font-bold uppercase">
                                    {meeting.stage}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>
                                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {meeting.link && (
                            <a
                                href={meeting.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <VideoIcon className="h-3 w-3" />
                                Join Meeting
                            </a>
                        )}

                        {/* Notes Preview */}
                        {meeting.notes && meeting.notes.length > 0 && (
                            <div className="mt-4 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                {meeting.notes.slice(0, 1).map(note => (
                                    <Link
                                        key={note.id}
                                        href={`/notes/${note.id}`}
                                        className="group/note block p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                    >
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-3 h-3 mt-0.5 text-blue-500" />
                                            <div className="flex-1 min-w-0">
                                                {note.title && (
                                                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 truncate mb-0.5">
                                                        {note.title}
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-1 italic">
                                                    {note.content}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {meeting.notes.length > 1 && (
                                    <Link href={`/notes?meetingId=${meeting.id}`} className="text-[10px] text-zinc-400 hover:text-blue-500 font-medium px-1 transition-colors">
                                        + {meeting.notes.length - 1} more notes
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link
                            href={`/notes/new?meetingId=${meeting.id}`}
                            className="p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-md transition-colors dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            title="Add Note"
                        >
                            <FileText className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors dark:hover:bg-red-900/20"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Meeting?"
                description="Are you sure you want to delete this meeting? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
