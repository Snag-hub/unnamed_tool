'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { items, reminders, pushSubscriptions, users, notes } from '@/db/schema';

import { eq, and, desc, sql, ilike, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getMetadata } from '@/lib/metadata';
import webpush from 'web-push';
import { createItemSchema, updateItemSchema, addReminderSchema } from '@/lib/validations';
import { extractContent } from '@/lib/reader';

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

    const itemIds = slicedItems.map(i => i.id);
    const itemNotes = itemIds.length > 0
        ? await db.select().from(notes).where(inArray(notes.itemId, itemIds))
        : [];

    const { itemsToTags, tags: tagsTable } = await import('@/db/schema');
    const itemTagsFlat = itemIds.length > 0
        ? await db.select({
            itemId: itemsToTags.itemId,
            tag: tagsTable
        })
            .from(itemsToTags)
            .innerJoin(tagsTable, eq(itemsToTags.tagId, tagsTable.id))
            .where(inArray(itemsToTags.itemId, itemIds))
        : [];

    const itemsWithNotes = slicedItems.map(item => ({
        ...item,
        notes: itemNotes.filter(n => n.itemId === item.id),
        tags: itemTagsFlat.filter(it => it.itemId === item.id).map(it => it.tag)
    }));

    return {
        items: itemsWithNotes,
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

    const validated = addReminderSchema.parse({
        date,
        recurrence,
        itemId,
        title,
        taskId
    });

    await db.insert(reminders).values({
        id: uuidv4(),
        userId,
        itemId: validated.itemId || null,
        taskId: validated.taskId || null,
        title: validated.title || null,
        scheduledAt: validated.date,
        recurrence: validated.recurrence,
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

    const validated = updateItemSchema.parse(data);

    await db
        .update(items)
        .set({
            title: validated.title,
            reminderAt: validated.reminderAt,
            status: validated.status,
            isFavorite: validated.isFavorite,
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
    if (!userId) throw new Error('Unauthorized');

    const validated = createItemSchema.parse({ url, title, description });

    try {
        const existingItem = await db
            .select()
            .from(items)
            .where(and(eq(items.url, validated.url), eq(items.userId, userId)))
            .limit(1);

        if (existingItem.length > 0) {
            // Idempotency: Move to top (Bump) instead of duplicating
            const updatedItem = await db
                .update(items)
                .set({ createdAt: new Date(), status: 'inbox' })
                .where(eq(items.id, existingItem[0].id))
                .returning();

            revalidatePath('/inbox');
            return { success: true, message: 'Item already exists. Moved to top.', item: updatedItem[0] };
        }

        const metadata = await getMetadata(validated.url);

        // Extract content if it's an article
        let extracted = null;
        if (metadata.type === 'article') {
            extracted = await extractContent(validated.url);
        }

        const newItem = await db.insert(items).values({
            id: uuidv4(),
            userId,
            url: validated.url,
            title: validated.title || metadata.title,
            description: validated.description || metadata.description,
            image: metadata.image,
            siteName: metadata.siteName,
            favicon: metadata.favicon,
            type: metadata.type || 'other',
            author: metadata.author,
            status: 'inbox',
            content: extracted?.content,
            textContent: extracted?.textContent,
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

// Timeline: Get all events for a specific day
export async function getTimelineEvents(date: Date = new Date()) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get day bounds
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch meetings for the day
    const { meetings } = await import('@/db/schema');
    const todayMeetings = await db
        .select()
        .from(meetings)
        .where(
            and(
                eq(meetings.userId, userId),
                sql`${meetings.startTime} >= ${dayStart}`,
                sql`${meetings.startTime} <= ${dayEnd}`
            )
        )
        .orderBy(meetings.startTime);

    // Fetch tasks with due dates for the day
    const { tasks } = await import('@/db/schema');
    const todayTasks = await db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.userId, userId),
                sql`${tasks.dueDate} >= ${dayStart}`,
                sql`${tasks.dueDate} <= ${dayEnd}`,
                sql`${tasks.status} != 'done'`
            )
        )
        .orderBy(tasks.dueDate);

    // Fetch items with reminders for the day
    const todayItems = await db
        .select()
        .from(items)
        .where(
            and(
                eq(items.userId, userId),
                sql`${items.reminderAt} >= ${dayStart}`,
                sql`${items.reminderAt} <= ${dayEnd}`
            )
        )
        .orderBy(items.reminderAt);

    // Fetch general reminders for the day
    const todayReminders = await db
        .select()
        .from(reminders)
        .where(
            and(
                eq(reminders.userId, userId),
                sql`${reminders.scheduledAt} >= ${dayStart}`,
                sql`${reminders.scheduledAt} <= ${dayEnd}`
            )
        )
        .orderBy(reminders.scheduledAt);

    // Transform to timeline events
    const events: any[] = [];

    // Add meetings
    for (const meeting of todayMeetings) {
        events.push({
            id: meeting.id,
            type: 'meeting',
            title: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            duration: meeting.endTime
                ? Math.round((meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60))
                : 60, // Default 1 hour
            metadata: {
                meetingLink: meeting.link,
                meetingType: meeting.type,
                interviewStage: meeting.stage,
            },
        });
    }

    // Add tasks
    for (const task of todayTasks) {
        events.push({
            id: task.id,
            type: 'task',
            title: task.title,
            startTime: task.dueDate,
            duration: 30, // Default 30 min for tasks
            status: task.status,
            metadata: {
                projectId: task.projectId,
                priority: task.priority,
                taskType: task.type,
            },
        });
    }

    // Add items
    for (const item of todayItems) {
        events.push({
            id: item.id,
            type: 'item',
            title: item.title || 'Untitled',
            startTime: item.reminderAt!,
            duration: 15, // Default 15 min for reading
            url: item.url,
            favicon: item.favicon,
            metadata: {
                itemType: item.type,
                siteName: item.siteName,
            },
        });
    }

    // Add reminders
    for (const reminder of todayReminders) {
        events.push({
            id: reminder.id,
            type: 'reminder',
            title: reminder.title,
            startTime: reminder.scheduledAt,
            duration: 5, // Default 5 min for reminders
            metadata: {
                recurrence: reminder.recurrence,
                meetingId: reminder.meetingId,
                taskId: reminder.taskId,
                itemId: reminder.itemId,
            },
        });
    }

    return events;
}

export async function getItem(itemId: string) {
    const { userId } = await auth();
    if (!userId) return null;

    const result = await db.select()
        .from(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)))
        .limit(1);

    return result[0] || null;
}

export async function globalSearch(query: string) {
    const { userId } = await auth();
    if (!userId || !query) return { items: [], tasks: [], meetings: [], notes: [] };

    const searchPattern = `%${query}%`;

    const searchedItems = await db
        .select()
        .from(items)
        .where(
            and(
                eq(items.userId, userId),
                or(
                    ilike(items.title, searchPattern),
                    ilike(items.url, searchPattern),
                    ilike(items.description, searchPattern),
                    ilike(items.textContent, searchPattern)
                )
            )
        )
        .limit(5);

    const { tasks, meetings } = await import('@/db/schema');
    const searchedTasks = await db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.userId, userId),
                or(
                    ilike(tasks.title, searchPattern),
                    ilike(tasks.description, searchPattern)
                )
            )
        )
        .limit(5);

    const searchedMeetings = await db
        .select()
        .from(meetings)
        .where(
            and(
                eq(meetings.userId, userId),
                or(
                    ilike(meetings.title, searchPattern),
                    ilike(meetings.description, searchPattern)
                )
            )
        )
        .limit(5);

    const searchedNotes = await db
        .select()
        .from(notes)
        .where(
            and(
                eq(notes.userId, userId),
                or(
                    ilike(notes.title, searchPattern),
                    ilike(notes.content, searchPattern)
                )
            )
        )
        .limit(5);

    return {
        items: searchedItems,
        tasks: searchedTasks,
        meetings: searchedMeetings,
        notes: searchedNotes,
    };
}

export async function batchUpdateStatus(itemIds: string[], status: 'inbox' | 'reading' | 'archived' | 'trash') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(items)
        .set({ status })
        .where(and(inArray(items.id, itemIds), eq(items.userId, userId)));

    revalidatePath('/inbox');
    revalidatePath('/archive');
    revalidatePath('/trash');
}

export async function batchDeleteItems(itemIds: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(items)
        .where(and(inArray(items.id, itemIds), eq(items.userId, userId)));

    revalidatePath('/trash');
}
