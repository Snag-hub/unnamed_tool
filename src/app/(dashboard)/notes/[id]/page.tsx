import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getNote } from '@/app/note-actions';
import NoteEditor from './note-editor';

export default async function NotePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await currentUser();
    if (!user) {
        redirect('/');
    }

    const { id } = await params;

    // Handle "new" note creation
    if (id === 'new') {
        return (
            <main className="h-full">
                <NoteEditor note={null} />
            </main>
        );
    }

    // Fetch existing note
    const note = await getNote(id);

    if (!note) {
        redirect('/notes');
    }

    return (
        <main className="h-full">
            <NoteEditor note={note} />
        </main>
    );
}
