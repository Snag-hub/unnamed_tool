'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function generateApiToken(userId: string) {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId || clerkUserId !== userId) {
        throw new Error('Unauthorized');
    }

    const newToken = uuidv4();

    await db
        .update(users)
        .set({ apiToken: newToken })
        .where(eq(users.id, userId));

    revalidatePath('/settings');
    return newToken;
}
