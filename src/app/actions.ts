'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { items, reminders } from '@/db/schema';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getMetadata } from '@/lib/metadata';

export async function fetchItems({
    page = 1,
    limit = 12,
    status = 'inbox',
    isFavorite,
    search,
    type = 'all',
}: {
    page?: number;
    limit?: number;
    status?: 'inbox' | 'reading' | 'archived' | 'trash';
    isFavorite?: boolean;
    search?: string;
    type?: 'all' | 'article' | 'video';
}) {
    const { userId } = await auth();
    if (!userId) return { items: [], hasMore: false };

    const offset = (page - 1) * limit;

    const conditions = [eq(items.userId, userId)];
    if (status) conditions.push(eq(items.status, status));
    if (isFavorite) conditions.push(eq(items.isFavorite, true));

    // Search Filter
    if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
            or(
                ilike(items.title, searchPattern),
                ilike(items.url, searchPattern),
                ilike(items.description, searchPattern)
            )! // Using ! because 'or' logic needs at least one arg, but here we supply 3. Drizzle types might be strict.
        );
    }

    // Type Filter
    if (type && type !== 'all') {
        conditions.push(eq(items.type, type));
    }

    const userItems = await db
        .select()
        .from(items)
        .where(and(...conditions))
        .orderBy(desc(items.createdAt))
        .limit(limit + 1) // Fetch one extra to check if there are more
        .offset(offset);

    const hasMore = userItems.length > limit;
    const slicedItems = hasMore ? userItems.slice(0, limit) : userItems;

    // Fetch reminders for these items to display the badge correctly if needed
    // For now, infinite scroll is efficiently fetching items. 
    // We can fetch reminders client side or join here. 
    // Let's stick to simple item fetch for now, and fetch reminders on demand or optimistic update.
    // Actually, to show the bell icon active state, we might need to know if there are reminders.
    // For MVP V2.3, let's just fetch them on demand in the dialog, 
    // and maybe a simple count or check if we want the badge. 
    // BUT, the existing implementation relied on `item.reminderAt`.
    // We should probably LEFT JOIN or just fetch reminders for looking up.
    // However, to keep it simple and performant, we will rely on client fetching or a separate call.

    return {
        items: slicedItems,
        hasMore,
    };
}

export async function addReminder(
    date: Date,
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' = 'none',
    itemId?: string,
    title?: string
) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    if (!itemId && !title) {
        throw new Error('Must provide either an Item ID or a Title for the reminder.');
    }

    await db.insert(reminders).values({
        id: uuidv4(),
        userId,
        itemId: itemId || null, // Ensure null if undefined/empty
        title: title || null,
        scheduledAt: date,
        recurrence,
    });

    // If it's an item reminder, update the legacy column
    if (itemId) {
        await db
            .update(items)
            .set({ reminderAt: date })
            .where(and(eq(items.id, itemId), eq(items.userId, userId)));
        revalidatePath('/inbox');
    } else {
        revalidatePath('/settings');
    }
}

// ... deleteReminder ...
export async function deleteReminder(reminderId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .delete(reminders)
        .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/settings');
}

// ... snoozeReminder ...
export async function snoozeReminder(reminderId: string, minutes: number) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // We can't use db.query.reminders.findFirst because we haven't defined relations in schema strictly enough for query builder in this file context maybe? 
    // Actually the previous code used db.query.reminders.findFirst but I don't see relations defined in the schema file I read.
    // Let's stick to standard queries to be safe, or trust the previous code if it worked.
    // Previous code: const reminder = await db.query.reminders.findFirst(...)
    // I'll assume db.query works.

    // Logic remains: updated time
    const newTime = new Date(Date.now() + minutes * 60000);

    await db
        .update(reminders)
        .set({ scheduledAt: newTime })
        .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId))); // Added userId check for safety

    revalidatePath('/inbox');
    revalidatePath('/settings');
}

export async function getReminders(itemId: string) {
    const { userId } = await auth();
    if (!userId) return [];

    return await db
        .select()
        .from(reminders)
        .where(and(eq(reminders.itemId, itemId), eq(reminders.userId, userId)))
        .orderBy(desc(reminders.scheduledAt));
}

export async function getGeneralReminders() {
    const { userId } = await auth();
    if (!userId) return [];

    // isnull(reminders.itemId) equivalent
    return await db
        .select()
        .from(reminders)
        .where(and(eq(reminders.userId, userId), sql`${reminders.itemId} IS NULL`))
        .orderBy(desc(reminders.scheduledAt));
}

export async function toggleFavorite(itemId: string, isFavorite: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .update(items)
        .set({ isFavorite })
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/favorites');
    revalidatePath('/archive');
}

export async function updateStatus(itemId: string, status: 'inbox' | 'reading' | 'archived' | 'trash') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .update(items)
        .set({ status })
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/favorites');
    revalidatePath('/archive');
    revalidatePath('/trash');
}

export async function deleteItem(itemId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .delete(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/favorites');
    revalidatePath('/archive');
    revalidatePath('/trash');
}
// ... deleteItem ...

export async function createItem(url: string, title?: string, description?: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized');
    }

    try {
        const existingItem = await db
            .select()
            .from(items)
            .where(and(eq(items.url, url), eq(items.userId, userId)))
            .limit(1);

        if (existingItem.length > 0) {
            return { success: true, message: 'Item already exists', item: existingItem[0] };
        }

        const metadata = await getMetadata(url);

        const newItem = await db.insert(items).values({
            id: uuidv4(),
            userId,
            url,
            title: title || metadata.title,
            description: description || metadata.description,
            image: metadata.image,
            siteName: metadata.siteName,
            favicon: metadata.favicon,
            type: metadata.type || 'other',
            author: metadata.author,
            status: 'inbox',
        }).returning();

        revalidatePath('/inbox');
        return { success: true, item: newItem[0] };
    } catch (error) {
        console.error('Create Item Error:', error);
        throw new Error('Failed to create item');
    }
}
