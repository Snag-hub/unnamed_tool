import { db } from '@/db';
import { items, reminders, users } from '@/db/schema';
import { sendEmail } from '@/lib/mail';
import { and, eq, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this endpoint is not cached

export async function GET(request: Request) {
    try {
        // In production, check for Authorization header (CRON_SECRET)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized', { status: 401 });

        const now = new Date();

        // 1. Fetch pending reminders
        // We join with users to get email
        // We join with items to get URL/Title (LEFT JOIN because itemId can be null)
        const pendingReminders = await db
            .select({
                reminder: reminders,
                user: users,
                item: items,
            })
            .from(reminders)
            .innerJoin(users, eq(reminders.userId, users.id))
            .leftJoin(items, eq(reminders.itemId, items.id))
            .where(lte(reminders.scheduledAt, now))
            .limit(50); // Batch size

        if (pendingReminders.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: 'No pending reminders' });
        }

        let processedCount = 0;

        for (const record of pendingReminders) {
            const { reminder, user, item } = record;

            // Construct Email Content
            const subject = item
                ? `Reminder: Time to read "${item.title || item.url}"`
                : `Reminder: ${reminder.title || 'General Task'}`;

            const html = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>${subject}</h2>
                    ${item ? `
                        <p>You asked us to remind you about this link:</p>
                        <p><a href="${item.url}" style="color: blue; text-decoration: underline; font-size: 16px;">${item.title || item.url}</a></p>
                        ${item.description ? `<p style="color: #666; font-style: italic;">"${item.description}"</p>` : ''}
                    ` : `
                        <p>This is your scheduled reminder.</p>
                        <p><strong>${reminder.title || 'Untitled Task'}</strong></p>
                    `}
                    <hr />
                    <p style="font-size: 12px; color: #888;">Sent by Link Locker</p>
                </div>
            `;

            // Send Email
            await sendEmail({
                to: user.email,
                subject,
                html,
            });

            // Handle Recurrence or Deletion
            if (reminder.recurrence === 'none') {
                await db.delete(reminders).where(eq(reminders.id, reminder.id));
            } else {
                let nextDate = new Date(reminder.scheduledAt);
                switch (reminder.recurrence) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                }

                // If next date is still in the past (e.g. server was down for a week), 
                // push it to future relative to NOW (or just catch up? Catch up might spam. Let's push to future based on NOW)
                // Simple version: just add the interval to the old scheduledAt. 
                // Ideally we should ensure it's > now. 
                // For simplified "Daily" logic, if I missed yesterday's, I probably want tomorrow's, not one 5 mins from now.
                // Keeping strict interval for now.

                await db
                    .update(reminders)
                    .set({ scheduledAt: nextDate })
                    .where(eq(reminders.id, reminder.id));
            }

            processedCount++;
        }

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
