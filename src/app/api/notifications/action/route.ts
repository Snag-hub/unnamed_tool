import { db } from '@/db';
import { items, reminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { action, itemId, type } = await request.json();

        if (!action || !itemId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        console.log(`🔔 [PUSH ACTION] ${action} on ${type} ${itemId}`);

        if (action === 'snooze') {
            // Snooze for 1 hour
            const newTime = new Date(Date.now() + 60 * 60 * 1000);

            if (type === 'reminder') {
                await db.update(reminders)
                    .set({ scheduledAt: newTime })
                    .where(eq(reminders.id, itemId));
            } else if (type === 'item') {
                await db.update(items)
                    .set({ reminderAt: newTime })
                    .where(eq(items.id, itemId));
            }

        } else if (action === 'mark-read') {
            // Only applies to items really, but if it's a reminder for an item, we can mark the item read?
            // Or just delete the reminder?
            // Let's assume for reminders it means "Done" -> Delete reminder
            // For items it means "Read" -> read=true

            if (type === 'reminder') {
                await db.delete(reminders).where(eq(reminders.id, itemId));
            } else if (type === 'item') {
                await db.update(items)
                    .set({ read: true, reminderAt: null }) // clear reminder too
                    .where(eq(items.id, itemId));
            }

        } else if (action === 'delete') {
            if (type === 'reminder') {
                await db.delete(reminders).where(eq(reminders.id, itemId));
            } else if (type === 'item') {
                // Should we delete the item or just the reminder?
                // "Delete" usually implies full deletion.
                await db.delete(items).where(eq(items.id, itemId));
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Push action failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
