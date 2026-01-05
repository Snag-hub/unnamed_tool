import { db } from '@/db';
import { tasks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // In production, check for Authorization header (CRON_SECRET)
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const now = new Date();
        let resetCount = 0;

        // Find all recurring tasks that are marked as done
        const recurringTasks = await db
            .select()
            .from(tasks)
            .where(and(
                eq(tasks.isRecurring, true),
                eq(tasks.status, 'done')
            ));

        // Reset tasks that should have been reset already
        for (const task of recurringTasks) {
            if (!task.lastCompletedAt || !task.reminderTime || !task.recurrencePattern) continue;

            const lastCompleted = new Date(task.lastCompletedAt);
            const [hours, minutes] = task.reminderTime.split(':').map(Number);

            // Calculate when the next occurrence should have been
            const nextOccurrence = new Date(lastCompleted);
            nextOccurrence.setHours(hours, minutes, 0, 0);

            switch (task.recurrencePattern) {
                case 'daily':
                    nextOccurrence.setDate(nextOccurrence.getDate() + 1);
                    break;
                case 'weekly':
                    nextOccurrence.setDate(nextOccurrence.getDate() + 7);
                    break;
                case 'monthly':
                    nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
                    break;
            }

            // If the next occurrence time has passed, reset the task
            if (nextOccurrence <= now) {
                await db.update(tasks).set({
                    status: 'pending',
                    updatedAt: new Date()
                }).where(eq(tasks.id, task.id));

                resetCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Reset ${resetCount} recurring task(s)`,
            resetCount
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal Server Error'
        }, { status: 500 });
    }
}
