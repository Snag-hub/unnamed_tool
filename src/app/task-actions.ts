'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function getTasks() {
    const { userId } = await auth();
    if (!userId) return [];

    const result = await db
        .select({
            task: tasks,
            project: projects
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt));

    // Flatten structure for easier consumption: { ...task, project: { ...project } }
    return result.map(({ task, project }) => ({
        ...task,
        project: project || null
    }));
}

export async function createTask(data: {
    title: string;
    description?: string;
    projectId?: string;
    dueDate?: Date;
    type?: 'personal' | 'work';
    priority?: 'low' | 'medium' | 'high';
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const newTask = await db.insert(tasks).values({
        id: uuidv4(),
        userId,
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        dueDate: data.dueDate,
        type: data.type || 'personal',
        status: 'pending',
        priority: data.priority || 'medium',
    }).returning();

    revalidatePath('/tasks');
    return { success: true, task: newTask[0] };
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'done' | 'archived') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(tasks).set({ status }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    revalidatePath('/tasks');
}

export async function deleteTask(taskId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    revalidatePath('/tasks');
}

export async function updateTask(taskId: string, data: {
    title?: string;
    description?: string;
    projectId?: string;
    dueDate?: Date | null;
    type?: 'personal' | 'work';
    priority?: 'low' | 'medium' | 'high';
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.update(tasks).set({
        ...data,
        updatedAt: new Date()
    }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

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

export async function getProjects() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(projects).where(eq(projects.userId, userId));
}
