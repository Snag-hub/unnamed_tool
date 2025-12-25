'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { meetings, reminders } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function getMeetings() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select()
        .from(meetings)
        .where(eq(meetings.userId, userId))
        .orderBy(asc(meetings.startTime)); // Sort by upcoming
}

export async function createMeeting(data: {
    title: string;
    description?: string;
    link?: string;
    startTime: Date;
    endTime: Date;
    type?: 'general' | 'interview';
    stage?: 'screening' | 'technical' | 'culture' | 'offer' | 'rejected';
    reminderOffset?: number; // Legacy single offset (kept for compatibility or primary custom)
    customReminders?: number[]; // Array of minutes before
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const meetingId = uuidv4();

    await db.insert(meetings).values({
        id: meetingId,
        userId,
        title: data.title,
        description: data.description,
        link: data.link,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || 'general',
        stage: data.stage || null,
    });

    // Default Offsets: 1d (1440), 1h (60), 30m, 10m, 5m, 2m
    const defaultOffsets = [1440, 60, 30, 10, 5, 2];

    // Merge defaults with any custom reminders provided
    const offsetsToSchedule = new Set(defaultOffsets);
    if (data.customReminders) {
        data.customReminders.forEach(min => offsetsToSchedule.add(min));
    }
    if (data.reminderOffset && data.reminderOffset > 0) {
        offsetsToSchedule.add(data.reminderOffset);
    }

    const now = new Date();

    for (const minutesBefore of offsetsToSchedule) {
        const scheduledAt = new Date(data.startTime.getTime() - minutesBefore * 60 * 1000);

        // Only schedule if it's in the future
        if (scheduledAt > now) {
            await db.insert(reminders).values({
                id: uuidv4(),
                userId,
                title: `Reminder: ${data.title} (${minutesBefore}m before)`,
                scheduledAt,
                recurrence: 'none',
                meetingId: meetingId,
            });
        }
    }

    revalidatePath('/meetings');
}

export async function deleteMeeting(meetingId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(meetings).where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)));
    revalidatePath('/meetings');
}
