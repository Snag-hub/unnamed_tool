import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="mx-auto max-w-3xl px-6 py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
                <p className="text-zinc-500 mb-12 italic">Last updated: December 29, 2025</p>

                <div className="space-y-12 prose dark:prose-invert max-w-none font-medium text-zinc-600 dark:text-zinc-400">
                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">1. Information We Collect</h2>
                        <p>
                            DayOS collects your name, email address, and profile picture via Clerk for authentication purposes. We also store the URLs, metadata, and extracted content of any items you save to the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">2. How We Use Data</h2>
                        <p>
                            Your data is used solely to provide the services of DayOS, including saving your reading list, fetching metadata, sending notifications, and providing search functionality. We do not sell or share your personal data with third parties for marketing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">3. Data Storage & Security</h2>
                        <p>
                            Your data is stored securely in a managed PostgreSQL database. Authentication is handled by Clerk, a leader in user identity management. We implement industry-standard security measures to protect your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">4. User Isolation</h2>
                        <p>
                            DayOS is built with strict multi-user isolation. No user can access or view data belonging to another user. Each workspace is private and secured by your unique identity.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">5. Contact</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:imsnag.1@gmail.com" className="text-blue-600 underline">imsnag.1@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
