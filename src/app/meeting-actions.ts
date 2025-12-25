'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { meetings } from '@/db/schema';
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
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.insert(meetings).values({
        id: uuidv4(),
        userId,
        title: data.title,
        description: data.description,
        link: data.link,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || 'general',
        stage: data.stage || null,
    });

    revalidatePath('/meetings');
}

export async function deleteMeeting(meetingId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(meetings).where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)));
    revalidatePath('/meetings');
}
