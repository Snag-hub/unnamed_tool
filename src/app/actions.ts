'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { items, reminders, pushSubscriptions, users } from '@/db/schema';

import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getMetadata } from '@/lib/metadata';
import webpush from 'web-push';

// Configure Web Push (Global scope for actions)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'test@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

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
    title?: string,
    taskId?: string
) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    if (!itemId && !title && !taskId) {
        throw new Error('Must provide either an Item ID, Task ID, or a Title for the reminder.');
    }

    await db.insert(reminders).values({
        id: uuidv4(),
        userId,
        itemId: itemId || null, // Ensure null if undefined/empty
        taskId: taskId || null,
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

export async function updateReminder(
    reminderId: string,
    date: Date,
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' = 'none',
    title?: string
) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .update(reminders)
        .set({
            scheduledAt: date,
            recurrence,
            title: title || null,
        })
        .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));

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

export async function updateItem(
    itemId: string,
    data: { title?: string; reminderAt?: Date | null }
) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .update(items)
        .set({
            title: data.title,
            reminderAt: data.reminderAt,
        })
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/favorites');
    revalidatePath('/archive');
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

export async function emptyTrash() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .delete(items)
        .where(
            and(
                eq(items.userId, userId),
                eq(items.status, 'trash')
            )
        );

    revalidatePath('/trash');
}

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
            // Idempotency: Move to top (Bump) instead of duplicating
            const updatedItem = await db
                .update(items)
                .set({ createdAt: new Date(), status: 'inbox' }) // Reset to inbox if archived? Optional, but safer to just bump.
                .where(eq(items.id, existingItem[0].id))
                .returning();

            revalidatePath('/inbox');
            return { success: true, message: 'Item already exists. Moved to top.', item: updatedItem[0] };
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


export async function savePushSubscription(subscription: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const sub = JSON.parse(subscription);

    await db.insert(pushSubscriptions).values({
        id: uuidv4(),
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
    }).onConflictDoNothing(); // Prevent duplicate subscriptions
}

export async function sendTestNotification(subscription: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    if (!process.env.VAPID_PRIVATE_KEY) {
        throw new Error('Server Error: VAPID_PRIVATE_KEY is missing in Vercel Environment Variables.');
    }

    const sub = JSON.parse(subscription);
    const payload = JSON.stringify({
        title: '🔔 Test Notification',
        body: 'It works! Your device is ready to receive DayOS alerts.',
        icon: '/icon-192.png',
        url: '/settings'
    });

    try {
        await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
        }, payload);
        return { success: true };
    } catch (error) {
        console.error('Test Notification Failed:', error);
        throw new Error('Failed to send test notification');
    }
}

export async function getPreferences() {
    const { userId } = await auth();
    if (!userId) return null;

    return await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
            emailNotifications: true,
            pushNotifications: true,
        },
    });
}

export async function updatePreferences(data: { emailNotifications: boolean; pushNotifications: boolean }) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db
        .update(users)
        .set(data)
        .where(eq(users.id, userId));

    revalidatePath('/settings');
}

// Analytics: Track when an item is viewed
export async function trackItemView(itemId: string) {
    const { userId } = await auth();
    if (!userId) return; // Silent fail for unauthenticated users

    try {
        await db
            .update(items)
            .set({
                viewCount: sql`${items.viewCount} + 1`,
                lastViewedAt: new Date(),
            })
            .where(and(eq(items.id, itemId), eq(items.userId, userId)));
    } catch (error) {
        // Silent fail - don't block UI for analytics
        console.error('Failed to track item view:', error);
    }
}

// Analytics: Get user stats
export async function getUserStats() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const stats = await db
        .select({
            totalSaved: sql<number>`count(*)::int`,
            totalRead: sql<number>`count(*) filter (where ${items.viewCount} > 0)::int`,
        })
        .from(items)
        .where(eq(items.userId, userId));

    const mostViewed = await db
        .select({
            id: items.id,
            title: items.title,
            url: items.url,
            viewCount: items.viewCount,
            favicon: items.favicon,
        })
        .from(items)
        .where(and(eq(items.userId, userId), sql`${items.viewCount} > 0`))
        .orderBy(desc(items.viewCount))
        .limit(5);

    return {
        totalSaved: stats[0]?.totalSaved || 0,
        totalRead: stats[0]?.totalRead || 0,
        readPercentage: stats[0]?.totalSaved > 0
            ? Math.round((stats[0].totalRead / stats[0].totalSaved) * 100)
            : 0,
        mostViewed,
    };
}
