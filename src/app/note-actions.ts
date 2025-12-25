'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Create a new note
export async function createNote(data: {
    title?: string;
    content: string;
    taskId?: string | null;
    meetingId?: string | null;
    itemId?: string | null;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const noteId = uuidv4();

    await db.insert(notes).values({
        id: noteId,
        userId,
        title: data.title || null,
        content: data.content,
        taskId: data.taskId || null,
        meetingId: data.meetingId || null,
        itemId: data.itemId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath('/notes');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    revalidatePath('/inbox');

    return noteId;
}

// Update a note
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

    await db
        .update(notes)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    revalidatePath('/notes');
    revalidatePath(`/notes/${noteId}`);
}

// Delete a note
export async function deleteNote(noteId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    revalidatePath('/notes');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    revalidatePath('/inbox');
}

// Get notes with optional filters
export async function getNotes(filters?: {
    taskId?: string;
    meetingId?: string;
    itemId?: string;
    search?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    let query = db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .$dynamic();

    // Apply filters
    if (filters?.taskId) {
        query = query.where(eq(notes.taskId, filters.taskId));
    }
    if (filters?.meetingId) {
        query = query.where(eq(notes.meetingId, filters.meetingId));
    }
    if (filters?.itemId) {
        query = query.where(eq(notes.itemId, filters.itemId));
    }
    if (filters?.search) {
        query = query.where(
            or(
                ilike(notes.content, `%${filters.search}%`),
                ilike(notes.title, `%${filters.search}%`)
            )
        );
    }

    const result = await query.orderBy(desc(notes.updatedAt));
    return result;
}

// Get a single note
export async function getNote(noteId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const result = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

    return result[0] || null;
}

// Fetch potential attachment targets
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
