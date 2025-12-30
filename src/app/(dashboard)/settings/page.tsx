import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SettingsClient from './client';
import Link from 'next/link';
import { getUserStats } from '@/app/actions';

export default async function SettingsPage() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        redirect('/');
    }

    let apiToken: string | null = null;
    let preferences = { emailNotifications: true, pushNotifications: true };
    let stats: Awaited<ReturnType<typeof getUserStats>> = {
        totalSaved: 0,
        totalRead: 0,
        readPercentage: 0,
        mostViewed: []
    };

    try {
        // Try to find user in our database
        const result = await db
            .select({
                apiToken: users.apiToken,
                emailNotifications: users.emailNotifications,
                pushNotifications: users.pushNotifications,
            })
            .from(users)
            .where(eq(users.id, clerkUser.id))
            .limit(1);

        if (result.length === 0) {
            // Create user if doesn't exist
            await db.insert(users).values({
                id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
                image: clerkUser.imageUrl || null,
            });
        } else {
            apiToken = result[0]?.apiToken || null;
            preferences = {
                emailNotifications: result[0].emailNotifications,
                pushNotifications: result[0].pushNotifications,
            };
        }

        // Fetch analytics stats
        stats = await getUserStats();


    } catch (error) {
        console.error('Error fetching/creating user:', error);
    }

    return (
        <main className="p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
                    Settings
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    Manage your account and API access
                </p>
            </div>

            {/* Settings Content */}
            <div className="max-w-4xl mx-auto w-full">
                <SettingsClient
                    apiToken={apiToken}
                    userId={clerkUser.id}
                    initialPreferences={preferences}
                    initialStats={stats}
                />
            </div>
        </main>
    );
}
