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
      // Check for duplicate execution (Idempotency)
      if (user.lastDailyDigestAt) {
        const lastSent = new Date(user.lastDailyDigestAt);
        if (
          lastSent.getDate() === now.getDate() &&
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getFullYear() === now.getFullYear()
        ) {
          console.log(`⏭️  [DIGEST] Skipping ${user.email} - Already sent today`);
          continue;
        }
      }

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

      // Generate HTML (Improved Template)
      const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Daily Digest</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { background: #18181b; padding: 32px 24px; text-align: center; }
                .content { padding: 32px 24px; }
                .section { margin-bottom: 32px; }
                .section-title { font-size: 18px; font-weight: 700; color: #18181b; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #f4f4f5; padding-bottom: 8px; }
                .card { padding: 12px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; margin-bottom: 12px; }
                .meeting-time { font-family: monospace; font-size: 14px; color: #2563eb; font-weight: 600; }
                .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; }
                .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; margin-top: 8px; }
                .link { color: #2563eb; text-decoration: none; }
              </style>
            </head>
            <body>
              <div style="padding: 20px;">
                <div class="container">
                  
                  <!-- Header -->
                  <div class="header">
                    <img src="${appUrl}/icon-192.png" width="48" height="48" style="border-radius: 10px; margin-bottom: 12px;" alt="Logo" />
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Daily Briefing</h1>
                    <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 14px;">Productivity Update for ${user.name || 'Friend'}</p>
                  </div>

                  <div class="content">
                    
                    <!-- 1. Meetings -->
                    ${upcomingMeetings.length > 0 ? `
                    <div class="section">
                      <h2 class="section-title">📅 Today's Agenda</h2>
                      ${upcomingMeetings.map(m => `
                        <div class="card" style="border-left: 4px solid #3b82f6;">
                          <div style="font-weight: 600; color: #18181b;">${m.title}</div>
                          <div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                            <span class="meeting-time">
                              ${new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              ${new Date(m.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            ${m.link ? `<a href="${m.link}" class="link" style="font-size: 13px;">Join Meeting →</a>` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}

                    <!-- 2. Reminders -->
                    ${dueReminders.length > 0 ? `
                    <div class="section">
                       <h2 class="section-title">⏰ Don't Forget</h2>
                      ${dueReminders.map(r => `
                        <div class="card">
                          <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #18181b;">${r.title || r.itemTitle || 'Untitled Reminder'}</div>
                              <div style="font-size: 13px; color: #71717a; margin-top: 4px;">
                                Due: ${new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            ${r.itemUrl ? `<a href="${r.itemUrl}" style="text-decoration: none; font-size: 18px;">🔗</a>` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}

                    <!-- 3. New Inbox Items -->
                    ${newInboxItems.length > 0 ? `
                    <div class="section">
                      <h2 class="section-title">📥 Recently Saved</h2>
                      ${newInboxItems.map(i => `
                        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5;">
                           <a href="${i.url}" style="text-decoration: none; color: inherit; display: block;">
                             <div style="font-weight: 500; color: #18181b; font-size: 15px;">${i.title || i.url}</div>
                             ${i.siteName ? `<div style="font-size: 12px; color: #71717a; margin-top: 2px;">${i.siteName}</div>` : ''}
                           </a>
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}

                    <!-- CTA -->
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="${appUrl}/inbox" class="btn">
                        Open Dashboard
                      </a>
                    </div>

                  </div>
                  
                  <div class="footer">
                     You're receiving this because you enabled Email Notifications.
                     <br><a href="${appUrl}/settings" style="color: #71717a; text-decoration: underline;">Manage Preferences</a>
                  </div>
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

      // Update Timestamp
      await db.update(users)
        .set({ lastDailyDigestAt: new Date() })
        .where(eq(users.id, user.id));

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
