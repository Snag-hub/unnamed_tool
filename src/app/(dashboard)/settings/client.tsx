'use client';

import { generateApiToken } from './actions';
import { useState } from 'react';
import { ReminderScheduler } from '@/components/reminder-scheduler';

export default function SettingsClient({ apiToken, userId }: { apiToken?: string | null; userId: string }) {
    const [token, setToken] = useState(apiToken);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showReminders, setShowReminders] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const newToken = await generateApiToken(userId);
            setToken(newToken);
        } catch (error) {
            console.error(error);
            alert('Failed to generate token');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            {/* API Token Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
                            API Token
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                            Use this token to authenticate your browser extension. Keep it secret and never share it publicly.
                        </p>
                    </div>
                </div>

                {/* Token Display */}
                <div className="space-y-4">
                    <div className="relative">
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                            <code className="text-zinc-900 dark:text-zinc-100">
                                {token || 'No token generated yet'}
                            </code>
                        </div>
                        {token && (
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-xs font-medium transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-full transition-colors disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Generating...
                            </span>
                        ) : token ? (
                            'Regenerate Token'
                        ) : (
                            'Generate Token'
                        )}
                    </button>

                    {/* Warning */}
                    {token && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                        Keep this token secure
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                        If you regenerate the token, your browser extension will need to be updated with the new token.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* General Reminders Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
                            General Reminders
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                            Set personal reminders (e.g. "Read for 30 mins") that aren't tied to a specific item.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowReminders(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-full transition-colors"
                >
                    Manage Reminders
                </button>
            </div>

            {/* Usage Instructions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                    How to use your API token
                </h3>
                <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            1
                        </span>
                        <span>Generate your API token using the button above</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            2
                        </span>
                        <span>Copy the token to your clipboard</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            3
                        </span>
                        <span>Open your browser extension and paste the token when prompted</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            4
                        </span>
                        <span>Start saving articles directly from your browser!</span>
                    </li>
                </ol>

                {/* Extension Guide Link */}
                <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Need help installing the browser extension?{' '}
                        <a
                            href="https://github.com/Snag-hub/unnamed_tool/blob/main/EXTENSION_GUIDE.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Read the installation guide →
                        </a>
                    </p>
                </div>
            </div>

            {showReminders && (
                <ReminderScheduler onClose={() => setShowReminders(false)} />
            )}
        </div>
    );
}
