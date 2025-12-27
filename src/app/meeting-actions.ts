'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { meetings, reminders, notes } from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { meetingSchema } from '@/lib/validations';

export async function getMeetings() {
    const { userId } = await auth();
    if (!userId) return [];

    const result = await db.select()
        .from(meetings)
        .where(eq(meetings.userId, userId))
        .orderBy(asc(meetings.startTime)); // Sort by upcoming

    const meetingIds = result.map(m => m.id);
    const meetingNotes = meetingIds.length > 0
        ? await db.select().from(notes).where(inArray(notes.meetingId, meetingIds))
        : [];

    return result.map(meeting => ({
        ...meeting,
        notes: meetingNotes.filter(n => n.meetingId === meeting.id)
    }));
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

    const validated = meetingSchema.parse(data);
    const meetingId = uuidv4();

    await db.insert(meetings).values({
        id: meetingId,
        userId,
        title: validated.title,
        description: validated.description,
        link: validated.link || null,
        startTime: validated.startTime,
        endTime: validated.endTime,
        type: validated.type,
        stage: validated.stage,
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

export async function getMeeting(meetingId: string) {
    const { userId } = await auth();
    if (!userId) return null;

    const result = await db.select()
        .from(meetings)
        .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
        .limit(1);

    return result[0] || null;
}
