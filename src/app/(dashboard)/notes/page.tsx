import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getNotes } from '@/app/note-actions';
import { getTask } from '@/app/task-actions';
import { getMeeting } from '@/app/meeting-actions';
import { getItem } from '@/app/actions';
import NotesView from './notes-view';

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{
        search?: string;
        taskId?: string;
        meetingId?: string;
        itemId?: string;
    }>;
}) {
    const user = await currentUser();
    if (!user) {
        redirect('/');
    }

    const params = await searchParams;
    const notes = await getNotes({
        search: params.search,
        taskId: params.taskId,
        meetingId: params.meetingId,
        itemId: params.itemId,
    });

    let filterLabel = undefined;
    if (params.taskId) {
        const task = await getTask(params.taskId);
        if (task) filterLabel = `Task: ${task.title}`;
    } else if (params.meetingId) {
        const meeting = await getMeeting(params.meetingId);
        if (meeting) filterLabel = `Meeting: ${meeting.title}`;
    } else if (params.itemId) {
        const item = await getItem(params.itemId);
        if (item) filterLabel = `Article: ${item.title || item.url}`;
    }

    return (
        <main className="p-4 md:p-8 h-full">
            <NotesView
                initialNotes={notes}
                initialSearch={params.search}
                filterLabel={filterLabel}
            />
        </main>
    );
}
