'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tasks, projects, notes } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { taskSchema } from '@/lib/validations';

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

    const taskIds = result.map(({ task }) => task.id);
    const taskNotes = taskIds.length > 0
        ? await db.select().from(notes).where(inArray(notes.taskId, taskIds))
        : [];

    // Flatten structure for easier consumption: { ...task, project: { ...project } }
    return result.map(({ task, project }) => ({
        ...task,
        project: project || null,
        notes: taskNotes.filter(n => n.taskId === task.id)
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

    const validated = taskSchema.parse(data);

    const newTask = await db.insert(tasks).values({
        id: uuidv4(),
        userId,
        title: validated.title,
        description: validated.description,
        projectId: validated.projectId,
        dueDate: validated.dueDate,
        type: validated.type,
        status: validated.status,
        priority: validated.priority,
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

    const validated = taskSchema.partial().parse(data);

    await db.update(tasks).set({
        ...validated,
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
}
