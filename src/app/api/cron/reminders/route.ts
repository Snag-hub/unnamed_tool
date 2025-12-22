import { db } from '@/db';
import { items, users, pushSubscriptions, reminders } from '@/db/schema';
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'test@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();

        // 1. Find Due ITEMS (Legacy/Attached)
        const dueItems = await db
            .select({
                itemId: items.id,
                title: items.title,
                url: items.url,
                userId: items.userId,
                email: users.email,
                name: users.name,
                type: sql<string>`'item'`,
                recurrence: sql<string>`'none'`,
                favicon: items.favicon,
                siteName: items.siteName
            })
            .from(items)
            .innerJoin(users, eq(items.userId, users.id))
            .where(
                and(
                    isNotNull(items.reminderAt),
                    lt(items.reminderAt, now)
                )
            );

        // 2. Find Due REMINDERS (General/Quick)
        const dueReminders = await db
            .select({
                itemId: reminders.id,
                title: reminders.title,
                url: sql<string>`'/settings'`,
                userId: reminders.userId,
                email: users.email,
                name: users.name,
                type: sql<string>`'reminder'`,
                recurrence: reminders.recurrence,
                favicon: sql<string>`null`, // General reminders don't have external favicons
                siteName: sql<string>`'DayOS Header'`
            })
            .from(reminders)
            .innerJoin(users, eq(reminders.userId, users.id))
            .where(
                lt(reminders.scheduledAt, now)
            );

        const allDue = [...dueItems, ...dueReminders];

        if (allDue.length === 0) {
            return NextResponse.json({ message: 'No due reminders found.' });
        }

        console.log(`🔔 Found ${allDue.length} due reminders.`);

        // 3. Group by User
        const groupedByUser: Record<string, { name: string | null; email: string; items: typeof allDue }> = {};

        for (const item of allDue) {
            if (!groupedByUser[item.email]) {
                groupedByUser[item.email] = {
                    name: item.name,
                    email: item.email,
                    items: [],
                };
            }
            groupedByUser[item.email].items.push(item);
        }

        const results = [];
        // Use process.env.NEXTAUTH_URL or fallback. Ensure no trailing slash for consistent handling
        const appUrl = (process.env.NEXTAUTH_URL || 'https://dayos.app').replace(/\/$/, "");

        for (const email of Object.keys(groupedByUser)) {
            const userGroup = groupedByUser[email];

            const itemsHtml = userGroup.items
                .map(
                    (item) => `
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            ${item.favicon ? `<img src="${item.favicon}" width="16" height="16" style="border-radius: 4px;" onError="this.style.display='none'"/>` : ''}
            <a href="${item.type === 'item' ? item.url : appUrl + '/settings'}" style="color: #2563eb; text-decoration: none;">${item.title || 'Untitled Reminder'}</a>
          </h3>
          <p style="margin: 0; font-size: 14px; color: #52525b;">
            ${item.siteName ? `<span style="font-weight: 500; color: #18181b;">${item.siteName}</span> • ` : ''}
            ${item.type === 'item' ? 'Time to read!' : 'Reminder Due'}
            ${item.recurrence && item.recurrence !== 'none' ? ` • 🔁 ${item.recurrence}` : ''}
          </p>
        </div>
      `
                )
                .join('');

            const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${appUrl}/icon-192.png" width="48" height="48" style="border-radius: 12px; margin-bottom: 16px;" alt="DayOS Logo" />
            <h1 style="color: #18181b; margin: 0; font-size: 24px;">Reminder Due</h1>
          </div>
          <p>Hi ${userGroup.name || 'there'}, here are your reminders:</p>
          ${itemsHtml}
          <p style="margin-top: 24px; font-size: 12px; color: #a1a1aa; text-align: center;">
            <a href="${appUrl}/inbox" style="color: #52525b;">Open DayOS Inbox</a>
          </p>
        </div>
      `;

            await sendEmail({
                to: email,
                subject: `DayOS: ${userGroup.items.length} Reminder(s)`,
                html,
            });

            // Push Notifications
            try {
                const userId = userGroup.items[0].userId;
                const subs = await db
                    .select()
                    .from(pushSubscriptions)
                    .where(eq(pushSubscriptions.userId, userId));

                console.log(`Checking push for user ${userId}: Found ${subs.length} subscriptions`);

                if (subs.length > 0) {
                    const payload = JSON.stringify({
                        title: `DayOS: ${userGroup.items.length} Reminder(s)`,
                        body: userGroup.items.map(i => i.title).join(', '),
                        url: userGroup.items[0].type === 'item' ? '/inbox' : '/settings',
                    });

                    const pushResults = await Promise.allSettled(subs.map(sub =>
                        webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }, payload)
                    ));

                    pushResults.forEach((res, idx) => {
                        if (res.status === 'rejected') {
                            console.error(`Push sub ${idx} failed:`, res.reason);
                        } else {
                            console.log(`Push sub ${idx} success`);
                        }
                    });
                }
            } catch (error) {
                console.error('Push Logic Error:', error);
            }

            // Cleanup & Reschedule
            for (const item of userGroup.items) {
                if (item.type === 'item') {
                    // Items are currently always one-time reminders logic
                    await db.update(items).set({ reminderAt: null }).where(eq(items.id, item.itemId));
                } else {
                    // General Reminders: Check Recurrence
                    if (item.recurrence === 'daily') {
                        const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        await db.update(reminders).set({ scheduledAt: nextDate }).where(eq(reminders.id, item.itemId));
                    } else if (item.recurrence === 'weekly') {
                        const nextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        await db.update(reminders).set({ scheduledAt: nextDate }).where(eq(reminders.id, item.itemId));
                    } else if (item.recurrence === 'monthly') {
                        const nextDate = new Date();
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        await db.update(reminders).set({ scheduledAt: nextDate }).where(eq(reminders.id, item.itemId));
                    } else {
                        // One-time: Delete
                        await db.delete(reminders).where(eq(reminders.id, item.itemId));
                    }
                }
            }

            results.push({ email, count: userGroup.items.length });
        }

        return NextResponse.json({
            success: true,
            processed: results,
        });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
