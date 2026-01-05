'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tasks, projects, notes, reminders } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { taskSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

// Helper function to calculate next reminder date
function calculateNextReminderDate(reminderTime: string, recurrencePattern: 'daily' | 'weekly' | 'monthly'): Date {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const nextDate = new Date();

    nextDate.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, move to next occurrence
    if (nextDate <= now) {
        switch (recurrencePattern) {
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
    }

    return nextDate;
}

// --- Cached Functions ---

const getCachedTasks = unstable_cache(
    async (userId: string) => {
        const result = await db
            .select({
                task: tasks,
                project: projects
            })
            .from(tasks)
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(eq(tasks.userId, userId))
            .orderBy(desc(tasks.createdAt));

        const taskIds = result.map(({ task }) => task.id);
        const taskNotes = taskIds.length > 0
            ? await db.select().from(notes).where(inArray(notes.taskId, taskIds))
            : [];

        return result.map(({ task, project }) => ({
            ...task,
            project: project || null,
            notes: taskNotes.filter(n => n.taskId === task.id)
        }));
    },
    ['user-tasks'],
    { revalidate: 3600, tags: ['tasks'] }
);

const getCachedTask = unstable_cache(
    async (userId: string, taskId: string) => {
        const result = await db
            .select({
                task: tasks,
                project: projects
            })
            .from(tasks)
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .limit(1);

        if (!result[0]) return null;

        return {
            ...result[0].task,
            project: result[0].project || null
        };
    },
    ['single-task'],
    { revalidate: 3600, tags: ['tasks'] }
);

// --- Server Actions ---

export async function getTasks() {
    const { userId } = await auth();
    if (!userId) return [];
    return getCachedTasks(userId);
}

export async function createTask(data: {
    title: string;
    description?: string;
    projectId?: string;
    dueDate?: Date;
    type?: 'personal' | 'work';
    priority?: 'low' | 'medium' | 'high';
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | null;
    reminderTime?: string | null;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { success } = await rateLimit(`createTask:${userId}`, 10);
    if (!success) throw new Error('Too many tasks. Please slow down.');

    const validated = taskSchema.parse(data);

    const taskId = uuidv4();
    const newTask = await db.insert(tasks).values({
        id: taskId,
        userId,
        title: validated.title,
        description: validated.description,
        projectId: validated.projectId,
        dueDate: validated.dueDate,
        type: validated.type,
        status: validated.status,
        priority: validated.priority,
        isRecurring: validated.isRecurring,
        recurrencePattern: validated.recurrencePattern,
        reminderTime: validated.reminderTime,
    }).returning();

    // Create reminder if task is recurring
    if (validated.isRecurring && validated.reminderTime && validated.recurrencePattern) {
        const nextReminderDate = calculateNextReminderDate(validated.reminderTime, validated.recurrencePattern);
        await db.insert(reminders).values({
            id: uuidv4(),
            userId,
            taskId,
            title: `Reminder: ${validated.title}`,
            scheduledAt: nextReminderDate,
            recurrence: validated.recurrencePattern,
        });
    }

    revalidateTag('tasks', 'default' as any);
    revalidateTag('timeline', 'default' as any);
    revalidatePath('/tasks');

    return { success: true, task: newTask[0] };
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'done' | 'archived') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get task to check if it's recurring
    const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, taskId), eq(tasks.userId, userId))
    });

    if (!task) throw new Error('Task not found');

    // If task is recurring and being marked as done, reset it to pending
    if (task.isRecurring && status === 'done') {
        await db.update(tasks).set({
            status: 'pending',
            lastCompletedAt: new Date(),
            updatedAt: new Date()
        }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    } else {
        await db.update(tasks).set({ status, updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    }

    revalidateTag('tasks', 'default' as any);
    revalidateTag('timeline', 'default' as any);
    revalidatePath('/tasks');
}

export async function deleteTask(taskId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    revalidateTag('tasks', 'default' as any);
    revalidateTag('timeline', 'default' as any);
    revalidatePath('/tasks');
}

export async function updateTask(taskId: string, data: any) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const validated = taskSchema.partial().parse(data);

    // Get existing task to compare recurring settings
    const existingTask = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, taskId), eq(tasks.userId, userId))
    });

    if (!existingTask) throw new Error('Task not found');

    await db.update(tasks).set({
        ...validated,
        updatedAt: new Date()
    }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    // Handle reminder updates for recurring tasks
    if (validated.isRecurring !== undefined) {
        if (validated.isRecurring && validated.reminderTime && validated.recurrencePattern) {
            // Check if reminder exists
            const existingReminder = await db.query.reminders.findFirst({
                where: and(eq(reminders.taskId, taskId), eq(reminders.userId, userId))
            });

            const nextReminderDate = calculateNextReminderDate(validated.reminderTime, validated.recurrencePattern);

            if (existingReminder) {
                // Update existing reminder
                await db.update(reminders).set({
                    scheduledAt: nextReminderDate,
                    recurrence: validated.recurrencePattern,
                    title: `Reminder: ${validated.title || existingTask.title}`,
                }).where(eq(reminders.id, existingReminder.id));
            } else {
                // Create new reminder
                await db.insert(reminders).values({
                    id: uuidv4(),
                    userId,
                    taskId,
                    title: `Reminder: ${validated.title || existingTask.title}`,
                    scheduledAt: nextReminderDate,
                    recurrence: validated.recurrencePattern,
                });
            }
        } else if (!validated.isRecurring) {
            // Delete reminder if task is no longer recurring
            await db.delete(reminders).where(and(eq(reminders.taskId, taskId), eq(reminders.userId, userId)));
        }
    }

    revalidateTag('tasks', 'default' as any);
    revalidateTag('timeline', 'default' as any);
    revalidatePath('/tasks');
}

export async function createProject(name: string, color: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.insert(projects).values({
        id: uuidv4(),
        userId,
        name,
        color,
    });
    revalidatePath('/tasks');
}

export async function updateProject(projectId: string, name: string, color: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(projects)
        .set({ name, color })
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    revalidatePath('/tasks');
}

export async function deleteProject(projectId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    revalidatePath('/tasks');
}

export async function getProjects() {
    const { userId } = await auth();
    if (!userId) return [];
    return await db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getTask(taskId: string) {
    const { userId } = await auth();
    if (!userId) return null;
    return getCachedTask(userId, taskId);
}
