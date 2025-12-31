'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { items, reminders, pushSubscriptions, users, notes, tags, itemsToTags } from '@/db/schema';
import { eq, and, desc, sql, ilike, or, inArray } from 'drizzle-orm';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getMetadata } from '@/lib/metadata';
import webpush from 'web-push';
import { createItemSchema, updateItemSchema, addReminderSchema } from '@/lib/validations';
import { extractContent } from '@/lib/reader';
import { rateLimit } from '@/lib/rate-limit';

// Configure Web Push (Global scope for actions)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'test@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// --- Cached Functions ---

const getCachedItems = async (userId: string, page: number, limit: number, status: string, isFavorite?: boolean, search?: string, type?: string) => {
    return unstable_cache(
        async () => {
            const offset = (page - 1) * limit;
            const conditions = [eq(items.userId, userId)];
            if (status) conditions.push(eq(items.status, status as any));
            if (isFavorite) conditions.push(eq(items.isFavorite, true));

            if (search) {
                const searchPattern = `%${search}%`;
                conditions.push(or(ilike(items.title, searchPattern), ilike(items.url, searchPattern), ilike(items.description, searchPattern))!);
            }

            if (type && type !== 'all') {
                conditions.push(eq(items.type, type as any));
            }

            const userItems = await db
                .select()
                .from(items)
                .where(and(...conditions))
                .orderBy(desc(items.createdAt))
                .limit(limit + 1)
                .offset(offset);

            const hasMore = userItems.length > limit;
            const slicedItems = hasMore ? userItems.slice(0, limit) : userItems;
            const itemIds = slicedItems.map(i => i.id);

            try {
                const itemNotes = itemIds.length > 0
                    ? await db.select({
                        id: notes.id,
                        title: notes.title,
                        content: notes.content,
                        itemId: notes.itemId,
                        createdAt: notes.createdAt
                    }).from(notes).where(inArray(notes.itemId, itemIds))
                    : [];

                const itemTagsFlat = itemIds.length > 0
                    ? await db.select({
                        itemId: itemsToTags.itemId,
                        tagId: tags.id,
                        tagName: tags.name,
                        tagColor: tags.color
                    })
                        .from(itemsToTags)
                        .innerJoin(tags, eq(itemsToTags.tagId, tags.id))
                        .where(inArray(itemsToTags.itemId, itemIds))
                    : [];

                const itemsWithNotes = slicedItems.map(item => ({
                    ...item,
                    notes: itemNotes
                        .filter(n => n.itemId === item.id)
                        .map(n => ({ id: n.id, title: n.title, content: n.content, createdAt: n.createdAt })),
                    tags: itemTagsFlat
                        .filter(it => it.itemId === item.id)
                        .map(it => ({ id: it.tagId, name: it.tagName, color: it.tagColor }))
                }));

                return { items: itemsWithNotes, hasMore };
            } catch (error) {
                console.error('Error in fetchItems post-processing:', error);
                return { items: slicedItems.map(item => ({ ...item, notes: [], tags: [] })), hasMore };
            }
        },
        [`user-items-${userId}-${page}-${limit}-${status}-${isFavorite}-${search}-${type}`],
        { revalidate: 3600, tags: [`items-${userId}`] }
    )();
};

const getCachedTimelineEvents = async (userId: string, dateStr: string) => {
    return unstable_cache(
        async () => {
            const date = new Date(dateStr);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const { meetings: meetingTable, tasks: taskTable } = await import('@/db/schema');

            const [todayMeetings, todayTasks, todayItems, todayReminders] = await Promise.all([
                db.select().from(meetingTable).where(and(eq(meetingTable.userId, userId), sql`${meetingTable.startTime} >= ${dayStart}`, sql`${meetingTable.startTime} <= ${dayEnd}`)).orderBy(meetingTable.startTime),
                db.select().from(taskTable).where(and(eq(taskTable.userId, userId), sql`${taskTable.dueDate} >= ${dayStart}`, sql`${taskTable.dueDate} <= ${dayEnd}`, sql`${taskTable.status} != 'done'`)).orderBy(taskTable.dueDate),
                db.select().from(items).where(and(eq(items.userId, userId), sql`${items.reminderAt} >= ${dayStart}`, sql`${items.reminderAt} <= ${dayEnd}`)).orderBy(items.reminderAt),
                db.select().from(reminders).where(and(eq(reminders.userId, userId), sql`${reminders.scheduledAt} >= ${dayStart}`, sql`${reminders.scheduledAt} <= ${dayEnd}`)).orderBy(reminders.scheduledAt)
            ]);

            const events: any[] = [];
            for (const meeting of todayMeetings) events.push({ id: meeting.id, type: 'meeting', title: meeting.title, startTime: meeting.startTime, endTime: meeting.endTime, duration: meeting.endTime ? Math.round((meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60)) : 60, metadata: { meetingLink: meeting.link, meetingType: meeting.type, interviewStage: meeting.stage } });
            for (const task of todayTasks) events.push({ id: task.id, type: 'task', title: task.title, startTime: task.dueDate, duration: 30, status: task.status, metadata: { projectId: task.projectId, priority: task.priority, taskType: task.type } });
            for (const item of todayItems) events.push({ id: item.id, type: 'item', title: item.title || 'Untitled', startTime: item.reminderAt!, duration: 15, url: item.url, favicon: item.favicon, metadata: { itemType: item.type, siteName: item.siteName } });
            for (const reminder of todayReminders) events.push({ id: reminder.id, type: 'reminder', title: reminder.title, startTime: reminder.scheduledAt, duration: 5, metadata: { recurrence: reminder.recurrence, meetingId: reminder.meetingId, taskId: reminder.taskId, itemId: reminder.itemId } });

            return events;
        },
        [`user-timeline-${userId}-${dateStr}`],
        { revalidate: 3600, tags: [`timeline-${userId}`, `items-${userId}`, `tasks-${userId}`, `meetings-${userId}`] }
    )();
};

const getCachedUserStats = async (userId: string) => {
    return unstable_cache(
        async () => {
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
        },
        [`user-stats-${userId}`],
        { revalidate: 3600, tags: [`stats-${userId}`, `items-${userId}`] }
    )();
};

// --- Server Actions ---

export async function fetchItems(params: any) {
    const { userId } = await auth();
    if (!userId) return { items: [], hasMore: false };
    return getCachedItems(userId, params.page || 1, params.limit || 12, params.status || 'inbox', params.isFavorite, params.search, params.type || 'all');
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

    const validated = addReminderSchema.parse({ date, recurrence, itemId, title, taskId });

    await db.insert(reminders).values({
        id: uuidv4(),
        userId,
        itemId: validated.itemId || null,
        taskId: validated.taskId || null,
        title: validated.title || null,
        scheduledAt: validated.date,
        recurrence: validated.recurrence,
    });

    if (itemId) {
        await db.update(items).set({ reminderAt: date }).where(and(eq(items.id, itemId), eq(items.userId, userId)));
        revalidateTag(`items-${userId}`, 'default' as any);
        revalidatePath('/inbox');
    }
    revalidateTag(`timeline-${userId}`, 'default' as any);
    revalidatePath('/settings');
}

export async function deleteReminder(reminderId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(reminders).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));

    revalidateTag(`timeline-${userId}`, 'default' as any);
    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/settings');
}

export async function snoozeReminder(reminderId: string, minutes: number) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const newTime = new Date(Date.now() + minutes * 60000);

    await db.update(reminders).set({ scheduledAt: newTime }).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));

    revalidateTag(`timeline-${userId}`, 'default' as any);
    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/settings');
}

export async function updateReminder(reminderId: string, date: Date, recurrence: 'none' | 'daily' | 'weekly' | 'monthly' = 'none', title?: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(reminders).set({ scheduledAt: date, recurrence, title: title || null }).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));

    revalidateTag(`timeline-${userId}`, 'default' as any);
    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/settings');
}

export async function getReminders(itemId: string) {
    const { userId } = await auth();
    if (!userId) return [];
    return await db.select().from(reminders).where(and(eq(reminders.itemId, itemId), eq(reminders.userId, userId))).orderBy(desc(reminders.scheduledAt));
}

export async function getGeneralReminders() {
    const { userId } = await auth();
    if (!userId) return [];
    return await db.select().from(reminders).where(and(eq(reminders.userId, userId), sql`${reminders.itemId} IS NULL`)).orderBy(desc(reminders.scheduledAt));
}

export async function toggleFavorite(itemId: string, isFavorite: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(items).set({ isFavorite, updatedAt: new Date() }).where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/favorites');
}

export async function updateStatus(itemId: string, status: 'inbox' | 'reading' | 'archived' | 'trash') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(items).set({ status, updatedAt: new Date() }).where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/archive');
    revalidatePath('/favorites');
}

export async function updateItem(itemId: string, data: any) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const validated = updateItemSchema.parse(data);

    await db.update(items).set({ ...validated, updatedAt: new Date() }).where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
}

export async function deleteItem(itemId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(items).where(and(eq(items.id, itemId), eq(items.userId, userId)));

    revalidateTag(`items-${userId}`, 'default' as any);
    revalidateTag(`stats-${userId}`, 'default' as any);
    revalidatePath('/inbox');
    revalidatePath('/trash');
}

export async function emptyTrash() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(items).where(and(eq(items.userId, userId), eq(items.status, 'trash')));

    revalidateTag(`items-${userId}`, 'default' as any);
    revalidateTag(`stats-${userId}`, 'default' as any);
    revalidatePath('/trash');
}

export async function createItem(url: string, title?: string, description?: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    try {
        const { success } = await rateLimit(`createItem:${userId}`, 5);
        if (!success) {
            return { success: false, message: 'Too many requests. Please slow down.' };
        }

        const validated = createItemSchema.parse({ url, title, description });

        const existingItem = await db.select().from(items).where(and(eq(items.url, validated.url), eq(items.userId, userId))).limit(1);

        if (existingItem.length > 0) {
            const updatedItem = await db.update(items).set({ createdAt: new Date(), status: 'inbox' }).where(eq(items.id, existingItem[0].id)).returning();
            revalidateTag(`items-${userId}`, 'default' as any);
            revalidatePath('/inbox');
            return { success: true, message: 'Item already exists. Moved to top.', item: updatedItem[0] };
        }

        let metadata;
        try {
            metadata = await getMetadata(validated.url);
        } catch (e) {
            console.error('Metadata fetch failed, safely falling back:', e);
            metadata = {
                title: validated.title || validated.url,
                description: '',
                image: null,
                siteName: new URL(validated.url).hostname,
                favicon: null,
                type: 'other',
                author: null
            };
        }

        let extracted = null;
        if (metadata.type === 'article') {
            try {
                extracted = await extractContent(validated.url);
            } catch (e) {
                console.error('Content extraction failed, skipping:', e);
            }
        }

        const newItem = await db.insert(items).values({
            id: uuidv4(),
            userId,
            url: validated.url,
            title: validated.title || metadata.title || 'Untitled',
            description: validated.description || metadata.description,
            image: metadata.image || null,
            siteName: metadata.siteName,
            favicon: metadata.favicon,
            type: (metadata.type || 'other') as any,
            author: metadata.author,
            status: 'inbox',
            content: extracted?.content,
            textContent: extracted?.textContent,
        }).returning();

        revalidateTag(`items-${userId}`, 'default' as any);
        revalidateTag(`stats-${userId}`, 'default' as any);
        revalidatePath('/inbox');
        return { success: true, item: newItem[0] };
    } catch (error) {
        console.error('Create Item Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}

export async function savePushSubscription(subscription: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    const sub = JSON.parse(subscription);
    await db.insert(pushSubscriptions).values({ id: uuidv4(), userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }).onConflictDoNothing();
}

export async function sendTestNotification(subscription: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    if (!process.env.VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY missing');
    const sub = JSON.parse(subscription);
    const payload = JSON.stringify({ title: '🔔 Test Notification', body: 'It works!', icon: '/icon-192.png', url: '/settings' });
    try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, payload);
        return { success: true };
    } catch (error) {
        console.error('Test Notification Failed:', error);
        throw new Error('Failed to send test notification');
    }
}

export async function getPreferences() {
    const { userId } = await auth();
    if (!userId) return null;
    return await db.query.users.findFirst({ where: eq(users.id, userId), columns: { emailNotifications: true, pushNotifications: true } });
}

export async function updatePreferences(data: any) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    await db.update(users).set(data).where(eq(users.id, userId));
    revalidatePath('/settings');
}

export async function trackItemView(itemId: string) {
    const { userId } = await auth();
    if (!userId) return;
    try {
        await db.update(items).set({ viewCount: sql`${items.viewCount} + 1`, lastViewedAt: new Date() }).where(and(eq(items.id, itemId), eq(items.userId, userId)));
        revalidateTag(`stats-${userId}`, 'default' as any);
    } catch (error) {
        console.error('Failed to track item view:', error);
    }
}

export async function getUserStats() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    return getCachedUserStats(userId);
}

export async function getTimelineEvents(date: Date = new Date()) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    return getCachedTimelineEvents(userId, date.toISOString());
}

export async function getItem(itemId: string) {
    const { userId } = await auth();
    if (!userId) return null;
    const result = await db.select().from(items).where(and(eq(items.id, itemId), eq(items.userId, userId))).limit(1);
    return result[0] || null;
}

export async function globalSearch(query: string) {
    const { userId } = await auth();
    if (!userId || !query) return { items: [], tasks: [], meetings: [], notes: [] };

    const { success } = await rateLimit(`search:${userId}`, 20);
    if (!success) throw new Error('Too many searches. Please slow down.');

    const searchPattern = `%${query}%`;
    const searchedItems = await db.select().from(items).where(and(eq(items.userId, userId), or(ilike(items.title, searchPattern), ilike(items.url, searchPattern), ilike(items.description, searchPattern), ilike(items.textContent, searchPattern)))).limit(5);

    const { tasks: taskTable, meetings: meetingTable } = await import('@/db/schema');
    const [searchedTasks, searchedMeetings, searchedNotes] = await Promise.all([
        db.select().from(taskTable).where(and(eq(taskTable.userId, userId), or(ilike(taskTable.title, searchPattern), ilike(taskTable.description, searchPattern)))).limit(5),
        db.select().from(meetingTable).where(and(eq(meetingTable.userId, userId), or(ilike(meetingTable.title, searchPattern), ilike(meetingTable.description, searchPattern)))).limit(5),
        db.select().from(notes).where(and(eq(notes.userId, userId), or(ilike(notes.title, searchPattern), ilike(notes.content, searchPattern)))).limit(5)
    ]);

    return { items: searchedItems, tasks: searchedTasks, meetings: searchedMeetings, notes: searchedNotes };
}

export async function batchUpdateStatus(itemIds: string[], status: 'inbox' | 'reading' | 'archived' | 'trash') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    await db.update(items).set({ status, updatedAt: new Date() }).where(and(inArray(items.id, itemIds), eq(items.userId, userId)));
    revalidateTag(`items-${userId}`, 'default' as any);
    revalidatePath('/inbox');
}

export async function batchDeleteItems(itemIds: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');
    await db.delete(items).where(and(inArray(items.id, itemIds), eq(items.userId, userId)));
    revalidateTag(`items-${userId}`, 'default' as any);
    revalidateTag(`stats-${userId}`, 'default' as any);
    revalidatePath('/trash');
}
