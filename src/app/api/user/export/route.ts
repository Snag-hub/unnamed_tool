
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { items, tasks, notes, meetings, reminders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const [
            userItems,
            userTasks,
            userNotes,
            userMeetings,
            userReminders
        ] = await Promise.all([
            db.select().from(items).where(eq(items.userId, userId)),
            db.select().from(tasks).where(eq(tasks.userId, userId)),
            db.select().from(notes).where(eq(notes.userId, userId)),
            db.select().from(meetings).where(eq(meetings.userId, userId)),
            db.select().from(reminders).where(eq(reminders.userId, userId))
        ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            items: userItems,
            tasks: userTasks,
            notes: userNotes,
            meetings: userMeetings,
            reminders: userReminders
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="dayos-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error) {
        console.error('Export failed:', error);
        return new NextResponse('Export failed', { status: 500 });
    }
}
