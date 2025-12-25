import { currentUser } from '@clerk/nextjs/server';
import { getMeetings } from '@/app/meeting-actions';
import { MeetingCard } from '@/components/meeting-card';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default async function MeetingsPage() {
    const user = await currentUser();

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-black">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    You need to be signed in to view your meetings.
                </h1>
                <Link href="/" className="mt-4 text-blue-600 hover:underline">
                    Go to Home
                </Link>
            </div>
        );
    }

    const meetings = await getMeetings();

    // Group by Day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = meetings.filter(m => new Date(m.startTime) >= today);
    const past = meetings.filter(m => new Date(m.startTime) < today);

    return (
        <main className="p-4 md:p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Meetings</h1>
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                        Manage your schedule and interviews
                    </p>
                </div>
                <button disabled className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed">
                    <Calendar className="h-4 w-4" />
                    New Meeting (Coming Soon)
                </button>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 sticky top-0 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-sm py-2 z-10">Upcoming</h2>
                    {upcoming.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">No upcoming meetings.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map(meeting => (
                                <MeetingCard key={meeting.id} meeting={meeting} />
                            ))}
                        </div>
                    )}
                </section>

                {past.length > 0 && (
                    <section className="opacity-60">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Past</h2>
                        <div className="space-y-3">
                            {past.map(meeting => (
                                <MeetingCard key={meeting.id} meeting={meeting} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
