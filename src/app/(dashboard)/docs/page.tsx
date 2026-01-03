export default function UserGuidePage() {
    return (
        <div className="mx-auto max-w-4xl w-full p-6 lg:p-10 space-y-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                    User Guide
                </h1>
                <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
                    Master your productivity with DOs 4 DOERs.
                </p>
            </div>

            {/* Quick Start */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">🚀 Quick Start</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">1. Save Everything</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Use the browser extension to save articles, videos, and tasks in one click. We automatically extract the title and image.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">2. Set a Time</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Don't just bookmark it. Schedule <strong>when</strong> you'll do it. Everything in DOs 4 DOERs is a commitment.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">✨ Core Features</h2>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">📧</span> Daily Digest
                        </h3>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Instead of spamming you with emails, we send a single <strong>Daily Briefing</strong> at 6 PM. It contains:
                        </p>
                        <ul className="mt-4 space-y-2 list-disc list-inside text-zinc-600 dark:text-zinc-400 ml-4">
                            <li><strong>Today's Agenda:</strong> Upcoming meetings for the next 24 hours.</li>
                            <li><strong>Don't Forget:</strong> Reminders relevant to now.</li>
                            <li><strong>Recently Saved:</strong> A quick recap of your latest inbox items.</li>
                        </ul>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-800" />

                    <div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">🔔</span> Interactive Notifications
                        </h3>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Push notifications are actionable. You can manage tasks directly from the notification:
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30 text-center font-medium">
                                ✅ Mark Done
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 text-center font-medium">
                                💤 Snooze 1h
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30 text-center font-medium">
                                🗑️ Delete
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
