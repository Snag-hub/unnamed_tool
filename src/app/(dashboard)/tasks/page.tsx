import { currentUser } from '@clerk/nextjs/server';
import { getTasks } from '@/app/task-actions';
import { TaskList } from '@/components/task-list';
import Link from 'next/link';

export default async function TasksPage() {
    const user = await currentUser();

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-black">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    You need to be signed in to view your tasks.
                </h1>
                <Link href="/" className="mt-4 text-blue-600 hover:underline">
                    Go to Home
                </Link>
            </div>
        );
    }

    const tasks = await getTasks();

    return (
        <main className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Manage your action items
                </p>
            </div>

            <TaskList initialTasks={tasks} />
        </main>
    );
}
