import { db } from '@/db';
import { items, users, pushSubscriptions, reminders, meetings } from '@/db/schema';
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { withNotificationLogging } from '@/lib/notification-logger';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'test@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const cronStartTime = Date.now();
    console.log(`🔔 [CRON] Reminder job started at ${new Date().toISOString()}`);

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        console.log(`⏰ [CRON] Current time: ${now.toISOString()}`);

        // 1. Find Due ITEMS (Legacy/Attached)
        const itemQueryStart = Date.now();
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
                siteName: items.siteName,
                emailNotifications: users.emailNotifications,
                pushNotifications: users.pushNotifications
            })
            .from(items)
            .innerJoin(users, eq(items.userId, users.id))
            .where(
                and(
                    isNotNull(items.reminderAt),
                    lt(items.reminderAt, now)
                )
            );
        console.log(`📊 [CRON] Item query took ${Date.now() - itemQueryStart}ms - Found ${dueItems.length} items`);

        // 2. Find Due REMINDERS (General/Quick/Meetings)
        const reminderQueryStart = Date.now();
        const dueRemindersRaw = await db
            .select({
                itemId: reminders.id,
                title: reminders.title,
                userId: reminders.userId,
                email: users.email,
                name: users.name,
                type: sql<string>`'reminder'`,
                recurrence: reminders.recurrence,
                meetingId: reminders.meetingId,
                meetingTitle: meetings.title,
                taskId: reminders.taskId,
                emailNotifications: users.emailNotifications,
                pushNotifications: users.pushNotifications
            })
            .from(reminders)
            .innerJoin(users, eq(reminders.userId, users.id))
            .leftJoin(meetings, eq(reminders.meetingId, meetings.id))
            .where(
                lt(reminders.scheduledAt, now)
            );
        console.log(`📊 [CRON] Reminder query took ${Date.now() - reminderQueryStart}ms - Found ${dueRemindersRaw.length} reminders`);

        // Process reminders to format them correctly (Meeting vs General)
        const processedReminders = dueRemindersRaw.map(r => {
            if (r.meetingId && r.meetingTitle) {
                return {
                    ...r,
                    title: `Meeting: ${r.meetingTitle}`,
                    url: '/meetings',
                    siteName: 'DOs 4 DOERs Meeting',
                    favicon: null,
                };
            }
            // General Reminder
            return {
                ...r,
                url: '/settings',
                siteName: 'DOs 4 DOERs Reminder',
                favicon: null,
            };
        });

        const allDue = [...dueItems, ...processedReminders];

        if (allDue.length === 0) {
            const totalDuration = Date.now() - cronStartTime;
            console.log(`✅ [CRON] Completed in ${totalDuration}ms - No due reminders`);
            return NextResponse.json({ message: 'No due reminders found.', duration: totalDuration });
        }

        console.log(`🔔 [CRON] Found ${allDue.length} due reminders - Starting processing...`);

        // 3. Group by User
        const groupedByUser: Record<string, {
            name: string | null;
            email: string;
            items: typeof allDue;
            emailNotifications: boolean;
            pushNotifications: boolean
        }> = {};

        for (const item of allDue) {
            if (!groupedByUser[item.email]) {
                groupedByUser[item.email] = {
                    name: item.name,
                    email: item.email,
                    items: [],
                    emailNotifications: item.emailNotifications ?? true,
                    pushNotifications: item.pushNotifications ?? true,
                };
            }
            groupedByUser[item.email].items.push(item);
        }

        const results = [];
        // Use process.env.NEXTAUTH_URL or fallback. Ensure no trailing slash for consistent handling
        const appUrl = (process.env.NEXTAUTH_URL || 'https://dos4doers.app').replace(/\/$/, "");

        for (const email of Object.keys(groupedByUser)) {
            const userGroup = groupedByUser[email];

            const itemsHtml = userGroup.items
                .map(
                    (item) => `
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            ${item.favicon ? `<img src="${item.favicon}" width="16" height="16" style="border-radius: 4px;" onError="this.style.display='none'"/>` : ''}
            <a href="${item.type === 'item' ? item.url : appUrl + item.url}" style="color: #2563eb; text-decoration: none;">${item.title || 'Untitled Reminder'}</a>
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
            <img src="${appUrl}/icon-192.png" width="48" height="48" style="border-radius: 12px; margin-bottom: 16px;" alt="DOs 4 DOERs Logo" />
            <h1 style="color: #18181b; margin: 0; font-size: 24px;">Reminder Due</h1>
          </div>
          <p>Hi ${userGroup.name || 'there'}, here are your reminders:</p>
          ${itemsHtml}
          <p style="margin-top: 24px; font-size: 12px; color: #a1a1aa; text-align: center;">
            <a href="${appUrl}/inbox" style="color: #52525b;">Open DOs 4 DOERs Inbox</a>
          </p>
        </div>
      `;

            if (userGroup.emailNotifications) {
                // Only send emails for general reminders (not item-specific)
                // This conserves Resend free tier quota (3000 emails/month)
                const generalReminders = userGroup.items.filter(item => item.type === 'reminder');

                if (generalReminders.length > 0) {
                    const userId = userGroup.items[0].userId;

                    // Fetch top 5 latest inbox items for this user
                    const latestInboxItems = await db
                        .select({
                            id: items.id,
                            title: items.title,
                            url: items.url,
                            favicon: items.favicon,
                            siteName: items.siteName,
                            image: items.image,
                            createdAt: items.createdAt,
                        })
                        .from(items)
                        .where(
                            and(
                                eq(items.userId, userId),
                                eq(items.status, 'inbox')
                            )
                        )
                        .orderBy(sql`${items.createdAt} DESC`)
                        .limit(5);

                    // Build reminder cards HTML
                    const reminderCardsHtml = generalReminders
                        .map(
                            (item) => `
                        <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: transform 0.2s;">
                          <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                              <span style="font-size: 20px;">⏰</span>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                                <a href="${appUrl + item.url}" style="color: #18181b; text-decoration: none;">${item.title || 'Untitled Reminder'}</a>
                              </h3>
                              <p style="margin: 0; font-size: 13px; color: #71717a;">
                                ${item.siteName ? `${item.siteName} • ` : ''}Reminder Due${item.recurrence && item.recurrence !== 'none' ? ` • 🔁 ${item.recurrence}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      `
                        )
                        .join('');

                    // Build inbox items cards HTML
                    const inboxCardsHtml = latestInboxItems.length > 0 ? latestInboxItems
                        .map(
                            (item) => `
                        <a href="${item.url}" style="display: block; text-decoration: none; background: white; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; margin-bottom: 12px; transition: transform 0.2s;">
                          ${item.image ? `
                          <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); position: relative; overflow: hidden;">
                            <img src="${item.image}" alt="${item.title || 'Article'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                          </div>
                          ` : ''}
                          <div style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                              ${item.favicon ? `<img src="${item.favicon}" width="16" height="16" style="border-radius: 4px;" onerror="this.style.display='none'" />` : ''}
                              ${item.siteName ? `<span style="font-size: 12px; color: #71717a; font-weight: 500;">${item.siteName}</span>` : ''}
                            </div>
                            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #18181b; line-height: 1.4;">
                              ${item.title || 'Untitled'}
                            </h3>
                            <div style="display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              Read Now →
                            </div>
                          </div>
                        </a>
                      `
                        )
                        .join('') : '';

                    const enhancedHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>DOs 4 DOERs - Your Reminders</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f5;">
                      <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
                        <!-- Header with Gradient -->
                        <div style="background: linear-gradient(135deg, #0A1628 0%, #1e293b 100%); padding: 40px 24px; text-align: center; border-radius: 0 0 24px 24px;">
                          <img src="${appUrl}/icon-192.png" width="56" height="56" style="border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);" alt="DOs 4 DOERs Logo" />
                          <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Your Daily Digest</h1>
                          <p style="color: #94a3b8; margin: 0; font-size: 15px; font-weight: 500;">Hi ${userGroup.name || 'there'}, here's what needs your attention</p>
                        </div>

                        <!-- Content -->
                        <div style="padding: 32px 24px;">
                          <!-- Reminders Section -->
                          ${generalReminders.length > 0 ? `
                          <div style="margin-bottom: 32px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                              <div style="width: 4px; height: 24px; background: linear-gradient(180deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 2px;"></div>
                              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">⏰ Reminders Due</h2>
                            </div>
                            ${reminderCardsHtml}
                          </div>
                          ` : ''}

                          <!-- Latest Inbox Items Section -->
                          ${latestInboxItems.length > 0 ? `
                          <div style="margin-bottom: 32px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                              <div style="width: 4px; height: 24px; background: linear-gradient(180deg, #00D4FF 0%, #0EA5E9 100%); border-radius: 2px;"></div>
                              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">📚 Latest from Your Inbox</h2>
                            </div>
                            <p style="margin: 0 0 16px 0; font-size: 14px; color: #71717a;">Here are your 5 most recent saved items</p>
                            ${inboxCardsHtml}
                          </div>
                          ` : ''}

                          <!-- CTA Button -->
                          <div style="text-align: center; margin-top: 32px;">
                            <a href="${appUrl}/inbox" style="display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); transition: transform 0.2s;">
                              Open DOs 4 DOERs →
                            </a>
                          </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #fafafa; padding: 24px; text-align: center; border-radius: 24px 24px 0 0; margin-top: 32px;">
                          <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa; font-weight: 500;">
                            Less planning. More doing.
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #d4d4d8;">
                            <a href="${appUrl}/settings" style="color: #71717a; text-decoration: none;">Manage Preferences</a> • 
                            <a href="${appUrl}/inbox" style="color: #71717a; text-decoration: none;">View Inbox</a>
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;

                    await withNotificationLogging(
                        userId,
                        'email',
                        email,
                        async () => {
                            await sendEmail({
                                to: email,
                                subject: `DOs 4 DOERs: ${generalReminders.length} Reminder(s)${latestInboxItems.length > 0 ? ` + ${latestInboxItems.length} New Items` : ''}`,
                                html: enhancedHtml,
                            });
                        },
                        { reminderCount: generalReminders.length, inboxItemsCount: latestInboxItems.length, type: 'enhanced-digest' }
                    );

                    console.log(`📧 [CRON] Sent enhanced email with ${generalReminders.length} reminders and ${latestInboxItems.length} inbox items`);
                } else {
                    console.log(`⏭️  [CRON] Skipping email for ${email} - Only item-specific reminders (push notification sent instead)`);
                }
            } else {
                console.log(`Skipping email for ${email} (User Preference)`);
            }

            // Push Notifications
            if (userGroup.pushNotifications) {
                const userId = userGroup.items[0].userId;
                const subs = await db
                    .select()
                    .from(pushSubscriptions)
                    .where(eq(pushSubscriptions.userId, userId));

                console.log(`Checking push for user ${userId}: Found ${subs.length} subscriptions`);

                if (subs.length > 0) {
                    const payload = JSON.stringify({
                        title: `DOs 4 DOERs: ${userGroup.items.length} Reminder(s)`,
                        body: userGroup.items.map(i => i.title).join(', '),
                        url: userGroup.items[0].type === 'item' ? '/inbox' : userGroup.items[0].url,
                    });

                    // Send to each subscription with logging
                    for (const sub of subs) {
                        await withNotificationLogging(
                            userId,
                            'push',
                            sub.endpoint,
                            async () => {
                                await webpush.sendNotification({
                                    endpoint: sub.endpoint,
                                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                                }, payload);
                            },
                            { reminderCount: userGroup.items.length }
                        );
                    }
                }
            } else {
                console.log(`Skipping push for ${email} (User Preference)`);
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

        const totalDuration = Date.now() - cronStartTime;
        console.log(`✅ [CRON] Completed successfully in ${totalDuration}ms - Processed ${results.length} users`);

        return NextResponse.json({
            success: true,
            processed: results,
            duration: totalDuration,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
