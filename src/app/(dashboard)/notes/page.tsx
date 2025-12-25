import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getNotes } from '@/app/note-actions';
import NotesView from './notes-view';

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const user = await currentUser();
    if (!user) {
        redirect('/');
    }

    const params = await searchParams;
    const notes = await getNotes({ search: params.search });

    return (
        <main className="p-4 md:p-8 h-full">
            <NotesView initialNotes={notes} initialSearch={params.search} />
        </main>
    );
}
