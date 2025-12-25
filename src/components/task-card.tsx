'use client';

import { tasks } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { updateTaskStatus, deleteTask } from '@/app/task-actions';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';

type Task = InferSelectModel<typeof tasks>;

export function TaskCard({ task }: { task: Task }) {
    const [isPending, setIsPending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleStatusChange = async () => {
        setIsPending(true);
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        await updateTaskStatus(task.id, newStatus);
        setIsPending(false);
    };

    const handleDelete = async () => {
        setIsPending(true);
        await deleteTask(task.id);
        setIsPending(false);
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <div className={`group flex flex-col p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleStatusChange}
                        className={`mt-1 flex-shrink-0 h-5 w-5 rounded border border-zinc-300 dark:border-zinc-600 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'hover:border-zinc-400'}`}
                    >
                        {task.status === 'done' && <CheckIcon className="h-3.5 w-3.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${task.status === 'done' ? 'line-through text-zinc-500 dark:text-zinc-500' : ''}`}>
                            {task.title}
                        </h3>
                        {task.description && (
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                {task.description}
                            </p>
                        )}

                        <div className="mt-2 flex items-center gap-2 text-xs">
                            {task.priority !== 'medium' && (
                                <span className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold ${task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {task.priority}
                                </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase text-[10px] font-bold">
                                {task.type}
                            </span>

                            {task.dueDate && (
                                <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-zinc-500'}`}>
                                    <CalendarIcon className="h-3 w-3" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setShowEditDialog(true)}
                            className="p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-md transition-colors dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
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
                title="Delete Task?"
                description="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {showEditDialog && (
                <EditTaskDialog task={task} onClose={() => setShowEditDialog(false)} />
            )}
        </>
    );
}

function PencilIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
    )
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
        </svg>
    )
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    )
}
