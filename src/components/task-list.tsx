'use client';

import { tasks } from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { TaskCard } from './task-card';
import { CreateTaskDialog } from './create-task-dialog';
import { CreateProjectDialog } from './create-project-dialog';
import { ManageProjectsDialog } from './manage-projects-dialog';
import { useState } from 'react';
import { PlusIcon, FolderPlus, Settings2, CheckSquare } from 'lucide-react';
import { EmptyState } from './empty-state';

type Task = InferSelectModel<typeof tasks> & {
    project?: {
        name: string;
        color: string;
    } | null;
};

export function TaskList({ initialTasks, projects = [] }: { initialTasks: Task[], projects?: any[] }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showProjectDialog, setShowProjectDialog] = useState(false);
    const [showManageProjectsDialog, setShowManageProjectsDialog] = useState(false);

    // Filter into groups
    const pending = initialTasks.filter(t => t.status !== 'done' && t.status !== 'archived');
    const done = initialTasks.filter(t => t.status === 'done');

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowProjectDialog(true)}
                        className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Project</span>
                    </button>
                    <button
                        onClick={() => setShowManageProjectsDialog(true)}
                        className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Manage Projects"
                    >
                        <Settings2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Task
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {initialTasks.length === 0 ? (
                    <EmptyState
                        icon={CheckSquare}
                        title="No tasks yet"
                        description="Create a task to start tracking your work."
                        actionLabel="Create Task"
                        onAction={() => setShowCreateDialog(true)}
                    />
                ) : (
                    <>
                        {/* Pending Section */}
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Pending</h2>
                            {pending.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No pending tasks. All caught up!</p>
                            ) : (
                                <div className="space-y-3">
                                    {pending.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Done Section */}
                        {done.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Completed</h2>
                                <div className="space-y-3 opacity-60">
                                    {done.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showCreateDialog && (
                <CreateTaskDialog onClose={() => setShowCreateDialog(false)} projects={projects} />
            )}

            {showProjectDialog && (
                <CreateProjectDialog onClose={() => setShowProjectDialog(false)} />
            )}

            {showManageProjectsDialog && (
                <ManageProjectsDialog onClose={() => setShowManageProjectsDialog(false)} projects={projects} />
            )}
        </div>
    );
}
