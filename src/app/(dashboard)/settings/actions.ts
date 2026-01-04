'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
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

export async function deleteAccount() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    try {
        // 1. Delete from Clerk (Auth)
        // We do this first or parallel. If it fails, we shouldn't delete local data 
        // ideally, but for personal tools, ensuring local deletion is key too.
        // Let's try Clerk first.
        const client = await clerkClient();
        await client.users.deleteUser(userId);

        // 2. Delete from Database (Cascade will handle related data)
        // Note: verified users table has onDelete: cascade for everything else
        await db.delete(users).where(eq(users.id, userId));

        return { success: true };
    } catch (error) {
        console.error('Delete account error:', error);
        throw new Error('Failed to delete account');
    }
}

import webpush from 'web-push';
import { pushSubscriptions } from '@/db/schema';
import { withNotificationLogging } from '@/lib/notification-logger';

export async function sendTestNotification() {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
            `mailto:${process.env.EMAIL_FROM || 'test@example.com'}`,
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } else {
        throw new Error('VAPID keys not configured');
    }

    const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
        return { success: false, message: 'No push subscriptions found. Please enable notifications first.' };
    }

    let successCount = 0;
    const payload = JSON.stringify({
        title: '🔔 Test Notification',
        body: 'This is a test notification from DOs 4 DOERs.',
        url: '/settings',
        type: 'test',
        userId: userId,
    });

    for (const sub of subs) {
        try {
            await withNotificationLogging(
                userId,
                'push',
                sub.endpoint,
                async () => {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload);
                },
                { type: 'test' }
            );
            successCount++;
        } catch (error) {
            console.error('Failed to send test push:', error);
        }
    }

    return { success: true, count: successCount };
}
