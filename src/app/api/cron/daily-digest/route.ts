import { db } from '@/db';
import { items, reminders, users, meetings } from '@/db/schema';
import { sendEmail } from '@/lib/email';
import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cronStartTime = Date.now();
    console.log(`📧 [DIGEST] Daily Digest job started at ${new Date().toISOString()}`);

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Select ALL users who want email notifications
    const subscribers = await db
      .select()
      .from(users)
      .where(eq(users.emailNotifications, true));

    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers found' });
    }

    console.log(`📊 [DIGEST] Processing digest for ${subscribers.length} users`);

    const results = [];
    const appUrl = (process.env.NEXTAUTH_URL || 'https://dos4doers.app').replace(/\/$/, "");

    for (const user of subscribers) {
      // A. Fetch Upcoming Meetings (Next 24h)
      const upcomingMeetings = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, user.id),
            gte(meetings.startTime, now),
            lt(meetings.startTime, tomorrow)
          )
        )
        .orderBy(meetings.startTime);

      // B. Fetch Due Reminders (Past due or due in next 24h)
      // Note: We might want to filter out ones that were already sent? 
      // For a digest, it's nice to see "what's pending" regardless.
      const dueReminders = await db
        .select({
          id: reminders.id,
          title: reminders.title,
          scheduledAt: reminders.scheduledAt,
          recurrence: reminders.recurrence,
          itemId: reminders.itemId,
          itemTitle: items.title,
          itemUrl: items.url,
          itemSiteName: items.siteName,
          itemFavicon: items.favicon
        })
        .from(reminders)
        .leftJoin(items, eq(reminders.itemId, items.id))
        .where(
          and(
            eq(reminders.userId, user.id),
            lte(reminders.scheduledAt, tomorrow) // pending or due soon
          )
        )
        .orderBy(reminders.scheduledAt)
        .limit(10);

      // C. Fetch Latest Inbox Items (Created in last 24h)
      const newInboxItems = await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.userId, user.id),
            eq(items.status, 'inbox'),
            gte(items.createdAt, yesterday)
          )
        )
        .orderBy(sql`${items.createdAt} DESC`)
        .limit(5);

      // If nothing to report, skip
      if (upcomingMeetings.length === 0 && dueReminders.length === 0 && newInboxItems.length === 0) {
        console.log(`⏭️  [DIGEST] Skipping ${user.email} - No content`);
        continue;
      }

      // Generate HTML
      const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Daily Digest</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 24px; text-align: center; border-radius: 0 0 24px 24px;">
                  <img src="${appUrl}/icon-192.png" width="56" height="56" style="border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" alt="Logo" />
                  <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Daily Briefing</h1>
                  <p style="color: #e0e7ff; margin: 0; font-size: 15px; font-weight: 500;">Good evening, ${user.name || 'Friend'}</p>
                </div>

                <div style="padding: 32px 24px;">
                  
                  <!-- 1. Meetings -->
                  ${upcomingMeetings.length > 0 ? `
                  <div style="margin-bottom: 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #18181b; display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">📅</span> Today's Agenda
                    </h2>
                    ${upcomingMeetings.map(m => `
                      <div style="border-left: 3px solid #3b82f6; background: #eff6ff; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
                        <div style="font-weight: 600; color: #1e3a8a;">${m.title}</div>
                        <div style="font-size: 13px; color: #3b82f6; margin-top: 4px;">
                          ${new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          ${new Date(m.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ${m.link ? ` • <a href="${m.link}" style="color: #3b82f6; text-decoration: underline;">Join Link</a>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  ` : ''}

                  <!-- 2. Reminders -->
                  ${dueReminders.length > 0 ? `
                  <div style="margin-bottom: 32px;">
                     <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #18181b; display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">⏰</span> Don't Forget
                    </h2>
                    ${dueReminders.map(r => `
                      <div style="padding: 12px; border: 1px solid #e4e4e7; border-radius: 12px; margin-bottom: 8px; background: #fff;">
                        <div style="font-weight: 600; color: #18181b;">${r.title || r.itemTitle || 'Untitled Reminder'}</div>
                        <div style="font-size: 13px; color: #71717a; margin-top: 4px;">
                          Due: ${new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ${r.itemUrl ? ` • <a href="${r.itemUrl}" style="color: #4f46e5; text-decoration: none;">Open Link →</a>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  ` : ''}

                  <!-- 3. New Inbox Items -->
                  ${newInboxItems.length > 0 ? `
                  <div style="margin-bottom: 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #18181b; display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">📥</span> Recently Saved
                    </h2>
                    ${newInboxItems.map(i => `
                      <a href="${i.url}" style="display: block; text-decoration: none; color: inherit; margin-bottom: 12px;">
                        <div style="display: flex; gap: 12px; padding: 12px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; align-items: center;">
                           ${i.image ? `<img src="${i.image}" width="60" height="60" style="border-radius: 8px; object-fit: cover; background: #f4f4f5;" />` : ''}
                           <div style="flex: 1; min-width: 0;">
                             <div style="font-weight: 600; font-size: 14px; color: #18181b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.title || i.url}</div>
                             ${i.siteName ? `<div style="font-size: 12px; color: #71717a; margin-top: 2px;">${i.siteName}</div>` : ''}
                           </div>
                        </div>
                      </a>
                    `).join('')}
                  </div>
                  ` : ''}

                  <!-- CTA -->
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${appUrl}/inbox" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 32px; font-weight: 600; font-size: 14px;">
                      Open Dashboard
                    </a>
                  </div>

                </div>
                
                <div style="background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa;">
                   You're receiving this because you enabled Email Notifications.
                   <br><a href="${appUrl}/settings" style="color: #71717a; text-decoration: underline;">Manage Preferences</a>
                </div>
              </div>
            </body>
            </html>
            `;

      // Send
      await sendEmail({
        to: user.email,
        subject: `Daily Briefing: ${upcomingMeetings.length} Meetings, ${dueReminders.length} Reminders`,
        html
      });

      results.push({ email: user.email });
    }

    const totalDuration = Date.now() - cronStartTime;
    console.log(`✅ [DIGEST] Completed in ${totalDuration}ms`);

    return NextResponse.json({ success: true, processed: results.length, duration: totalDuration });

  } catch (error) {
    console.error('Digest job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
