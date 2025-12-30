import { NextResponse } from 'next/server';
import { db } from '@/db';
import { items, tasks } from '@/db/schema';
import { eq, lt, and } from 'drizzle-orm';

export async function GET(req: Request) {
    // Simple auth check via secret header to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Delete items that have been in 'trash' for more than 30 days
        // FIXME: 'items' table does not have 'updatedAt' column. 
        // We cannot safely determine when an item was moved to trash without it.
        // Disabling this Cleanup logic for items for now to prevent build errors.
        /*
        const deletedItems = await db.delete(items)
            .where(and(
                eq(items.status, 'trash'),
                lt(items.updatedAt, thirtyDaysAgo)
            ))
            .returning({ id: items.id });
        */
        const deletedItems: { id: string }[] = [];

        // 2. Archive tasks that have been 'done' for more than 30 days
        const archivedTasks = await db.update(tasks)
            .set({ status: 'archived' })
            .where(and(
                eq(tasks.status, 'done'),
                lt(tasks.updatedAt, thirtyDaysAgo)
            ))
            .returning({ id: tasks.id });

        return NextResponse.json({
            success: true,
            deletedItemsCount: deletedItems.length,
            archivedTasksCount: archivedTasks.length,
            message: `Cleaned ${deletedItems.length} items and archived ${archivedTasks.length} tasks.`
        });
    } catch (error) {
        console.error('Database cleanup failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
