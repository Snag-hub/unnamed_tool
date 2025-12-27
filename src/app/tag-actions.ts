'use server';

import { db } from '@/db';
import { tags, itemsToTags, tasksToTags, notesToTags } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { tagSchema } from '@/lib/validations';

export async function createTag(data: { name: string; color?: string }) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const validated = tagSchema.parse(data);

    const newTag = await db.insert(tags).values({
        id: uuidv4(),
        userId,
        name: validated.name,
        color: validated.color || '#3B82F6',
    }).returning();

    revalidatePath('/inbox');
    return newTag[0];
}

export async function getTags() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(tags).where(eq(tags.userId, userId));
}

export async function attachTagToItem(itemId: string, tagId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.insert(itemsToTags).values({ itemId, tagId }).onConflictDoNothing();
    revalidatePath('/inbox');
}

export async function detachTagFromItem(itemId: string, tagId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(itemsToTags).where(and(eq(itemsToTags.itemId, itemId), eq(itemsToTags.tagId, tagId)));
    revalidatePath('/inbox');
}

export async function attachTagToTask(taskId: string, tagId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.insert(tasksToTags).values({ taskId, tagId }).onConflictDoNothing();
    revalidatePath('/tasks');
}

export async function attachTagToNote(noteId: string, tagId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.insert(notesToTags).values({ noteId, tagId }).onConflictDoNothing();
    revalidatePath('/notes');
}
