'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { noteSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

// --- Cached Functions ---

const getCachedNotes = unstable_cache(
    async (userId: string, taskId?: string, meetingId?: string, itemId?: string, search?: string) => {
        let query = db
            .select()
            .from(notes)
            .where(eq(notes.userId, userId))
            .$dynamic();

        if (taskId) query = query.where(eq(notes.taskId, taskId));
        if (meetingId) query = query.where(eq(notes.meetingId, meetingId));
        if (itemId) query = query.where(eq(notes.itemId, itemId));
        if (search) {
            query = query.where(
                or(ilike(notes.content, `%${search}%`), ilike(notes.title, `%${search}%`))
            );
        }

        return await query.orderBy(desc(notes.updatedAt));
    },
    ['user-notes'],
    { revalidate: 3600, tags: ['notes'] }
);

const getCachedNote = unstable_cache(
    async (userId: string, noteId: string) => {
        const result = await db
            .select()
            .from(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
            .limit(1);
        return result[0] || null;
    },
    ['single-note'],
    { revalidate: 3600, tags: ['notes'] }
);

// --- Server Actions ---

export async function createNote(data: {
    title?: string;
    content: string;
    taskId?: string | null;
    meetingId?: string | null;
    itemId?: string | null;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { success } = await rateLimit(`createNote:${userId}`, 10);
    if (!success) throw new Error('Too many notes. Please slow down.');

    const validated = noteSchema.parse(data);
    const noteId = uuidv4();

    await db.insert(notes).values({
        id: noteId,
        userId,
        title: validated.title || null,
        content: validated.content,
        taskId: validated.taskId || null,
        meetingId: validated.meetingId || null,
        itemId: validated.itemId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidateTag('notes', 'default' as any);
    revalidatePath('/notes');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    revalidatePath('/inbox');

    return noteId;
}

export async function updateNote(
    noteId: string,
    data: {
        title?: string;
        content?: string;
        taskId?: string | null;
        meetingId?: string | null;
        itemId?: string | null;
    }
) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const validated = noteSchema.partial().parse(data);

    await db
        .update(notes)
        .set({
            ...validated,
            updatedAt: new Date(),
        })
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    revalidateTag('notes', 'default' as any);
    revalidatePath('/notes');
    revalidatePath(`/notes/${noteId}`);
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    revalidatePath('/inbox');
}

export async function deleteNote(noteId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    revalidateTag('notes', 'default' as any);
    revalidatePath('/notes');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    revalidatePath('/inbox');
}

export async function getNotes(filters?: {
    taskId?: string;
    meetingId?: string;
    itemId?: string;
    search?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    return getCachedNotes(userId, filters?.taskId, filters?.meetingId, filters?.itemId, filters?.search);
}

export async function getNote(noteId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    return getCachedNote(userId, noteId);
}

export async function getAttachmentTargets() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const tasksList = await db.query.tasks.findMany({
        where: (tasks, { eq, and, ne }) => and(eq(tasks.userId, userId), ne(tasks.status, 'done')),
        limit: 10,
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });

    const meetingsList = await db.query.meetings.findMany({
        where: (meetings, { eq }) => eq(meetings.userId, userId),
        limit: 10,
        orderBy: (meetings, { desc }) => [desc(meetings.startTime)],
    });

    const itemsList = await db.query.items.findMany({
        where: (items, { eq, and, ne }) => and(eq(items.userId, userId), ne(items.status, 'archived')),
        limit: 10,
        orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    return {
        tasks: tasksList,
        meetings: meetingsList,
        items: itemsList,
    };
}
