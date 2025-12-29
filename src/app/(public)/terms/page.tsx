import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="mx-auto max-w-3xl px-6 py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
                <p className="text-zinc-500 mb-12 italic">Last updated: December 29, 2025</p>

                <div className="space-y-12 prose dark:prose-invert max-w-none font-medium text-zinc-600 dark:text-zinc-400">
                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using DayOS, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">2. Use of Service</h2>
                        <p>
                            DayOS is a personal productivity tool. You agree to use the service for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">3. Prohibited Activities</h2>
                        <p>
                            You may not use DayOS to store illegal content, attempt to breach our security, or use the service for any malicious purposes. Unauthorized access to other users' data is strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">4. Disclaimer of Warranty</h2>
                        <p>
                            DayOS is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">5. Limitation of Liability</h2>
                        <p>
                            In no event shall DayOS or its creator be liable for any indirect, incidental, or special damages arising out of or in connection with your use of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">6. Contact</h2>
                        <p>
                            For legal inquiries, please contact <a href="mailto:imsnag.1@gmail.com" className="text-blue-600 underline">imsnag.1@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
