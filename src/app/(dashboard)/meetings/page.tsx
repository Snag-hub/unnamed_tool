import { currentUser } from '@clerk/nextjs/server';
import { getMeetings } from '@/app/meeting-actions';
import { MeetingCard } from '@/components/meeting-card';
import { EmptyState } from '@/components/empty-state';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { NewMeetingButton } from '@/components/new-meeting-button';

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
                <NewMeetingButton />
            </div>

            {meetings.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No meetings scheduled"
                    description="You have no upcoming or past meetings."
                />
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 sticky top-0 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-sm py-2 z-10">Upcoming</h2>
                        {upcoming.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No upcoming meetings.</p>
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
            )}
        </main>
    );
}
