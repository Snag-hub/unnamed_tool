'use client';

import { generateApiToken } from './actions';
import { getGeneralReminders, addReminder, deleteReminder, updateReminder, updatePreferences } from '@/app/actions';
import { syncGoogleCalendar } from '@/app/calendar-actions';
import { useState, useEffect } from 'react';
import { ReminderScheduler } from '@/components/reminder-scheduler';

import { InferSelectModel } from 'drizzle-orm';
import { reminders } from '@/db/schema';


type Reminder = InferSelectModel<typeof reminders>;

type UserStats = {
    totalSaved: number;
    totalRead: number;
    readPercentage: number;
    mostViewed: Array<{
        id: string;
        title: string | null;
        url: string;
        viewCount: number;
        favicon: string | null;
    }>;
};

export default function SettingsClient({
    apiToken,
    userId,
    initialPreferences,
    initialStats,
}: {
    apiToken?: string | null;
    userId: string;
    initialPreferences?: { emailNotifications: boolean; pushNotifications: boolean };
    initialStats?: UserStats;
}) {
    // Token State
    const [token, setToken] = useState(apiToken);
    const [loadingToken, setLoadingToken] = useState(false);
    // Preferences State
    const [emailEnabled, setEmailEnabled] = useState(initialPreferences?.emailNotifications ?? true);
    const [pushEnabled, setPushEnabled] = useState(initialPreferences?.pushNotifications ?? true);

    const togglePreference = async (type: 'email' | 'push') => {
        const newValue = type === 'email' ? !emailEnabled : !pushEnabled;

        // Optimistic Update
        if (type === 'email') setEmailEnabled(newValue);
        else setPushEnabled(newValue);

        try {
            // Helper to subscribe to push notifications
            const subscribeToPush = async () => {
                if (!('serviceWorker' in navigator)) throw new Error('Service Worker not supported');

                const perm = await Notification.requestPermission();
                if (perm !== 'granted') throw new Error('Permission denied');

                let registration = await navigator.serviceWorker.getRegistration();
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/sw.js');
                }

                await navigator.serviceWorker.ready;
                registration = await navigator.serviceWorker.getRegistration();

                if (!registration?.active) throw new Error('Service Worker not active');

                const urlBase64ToUint8Array = (base64String: string) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                const key = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: key
                });

                const { savePushSubscription } = await import('@/app/actions');
                await savePushSubscription(JSON.stringify(sub));
            };

            // If enabling push, ensure subscription exists
            if (type === 'push' && newValue === true) {
                await subscribeToPush();
            }

            // Update preference in DB
            await updatePreferences({
                emailNotifications: type === 'email' ? newValue : emailEnabled,
                pushNotifications: type === 'push' ? newValue : pushEnabled,
            });
        } catch (error) {
            console.error('Failed to update preferences', error);
            // Revert state on error
            if (type === 'email') setEmailEnabled(!newValue);
            else setPushEnabled(!newValue);

            // Optional: Show error toast/alert
            alert(error instanceof Error ? error.message : 'Failed to update settings');
        }
    };
    const [copied, setCopied] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [testStatus, setTestStatus] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reminder State
    const [generalReminders, setGeneralReminders] = useState<Reminder[]>([]);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [addingReminder, setAddingReminder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            const data = await getGeneralReminders();
            setGeneralReminders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReminders(false);
        }
    };

    const handleGenerate = async () => {
        setLoadingToken(true);
        try {
            const newToken = await generateApiToken(userId);
            setToken(newToken);
        } catch (error) {
            console.error(error);
            alert('Failed to generate token');
        } finally {
            setLoadingToken(false);
        }
    };

    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAddQuickReminder = async () => {
        if (!reminderTitle || !reminderTime) return;
        setAddingReminder(true);
        try {
            // Parse time.
            const dateObj = new Date(reminderTime);

            if (editingId) {
                await updateReminder(editingId, dateObj, recurrence, reminderTitle);
                setEditingId(null);
            } else {
                await addReminder(dateObj, recurrence, undefined, reminderTitle);
            }

            await loadReminders();
            setReminderTitle('');
            setReminderTime('');
            setRecurrence('none');
        } catch (e) {
            console.error(e);
            alert('Failed to save reminder');
        } finally {
            setAddingReminder(false);
        }
    };

    const handleEdit = (reminder: Reminder) => {
        setEditingId(reminder.id);
        setReminderTitle(reminder.title || '');
        // Format for datetime-local: YYYY-MM-DDThh:mm
        const d = new Date(reminder.scheduledAt);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
        setReminderTime(localISOTime);
        setRecurrence(reminder.recurrence || 'none');

        // Scroll to form (optional UX)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setReminderTitle('');
        setReminderTime('');
        setRecurrence('none');
    };

    const handleDeleteReminder = async (id: string) => {
        if (confirm('Are you sure you want to delete this reminder?')) {
            setGeneralReminders(prev => prev.filter(r => r.id !== id)); // Optimistic
            await deleteReminder(id);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-8 w-full">


            {/* Preferences Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </span>
                        Preferences
                    </h2>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 gap-4 sm:gap-0">
                            <div className="min-w-0">
                                <p className="font-medium text-zinc-900 dark:text-white truncate">Email Notifications</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 break-words">Receive reminders via email</p>
                            </div>
                            <button
                                onClick={() => togglePreference('email')}
                                className={`self-start sm:self-center relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${emailEnabled ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 gap-4 sm:gap-0">
                            <div className="min-w-0">
                                <p className="font-medium text-zinc-900 dark:text-white truncate">Push Notifications</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 break-words">Receive reminders on this device</p>
                            </div>
                            <button
                                onClick={() => togglePreference('push')}
                                className={`self-start sm:self-center relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${pushEnabled ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </span>
                        Integrations
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 gap-4 sm:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-zinc-900 dark:text-white">Google Calendar</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Import upcoming events to your timeline</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const btn = document.getElementById('sync-btn');
                                if (btn) {
                                    btn.innerText = 'Syncing...';
                                    (btn as HTMLButtonElement).disabled = true;
                                }
                                try {
                                    const res = await syncGoogleCalendar();
                                    alert(res.message);
                                } catch (e) {
                                    alert('Sync failed');
                                } finally {
                                    if (btn) {
                                        btn.innerText = 'Sync Now';
                                        (btn as HTMLButtonElement).disabled = false;
                                    }
                                }
                            }}
                            id="sync-btn"
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            Sync Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Analytics Section */}
            {initialStats && (
                <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                    <div className="p-4 sm:p-8">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </span>
                            Your Stats
                        </h2>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Saved</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{initialStats.totalSaved}</p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Read</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{initialStats.totalRead}</p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Read Rate</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{initialStats.readPercentage}%</p>
                            </div>
                        </div>

                        {/* Most Viewed */}
                        {initialStats.mostViewed.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Most Viewed</h3>
                                <div className="space-y-2">
                                    {initialStats.mostViewed.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors"
                                        >
                                            {item.favicon && (
                                                <img src={item.favicon} alt="" className="w-4 h-4 rounded" />
                                            )}
                                            <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.title || item.url}</span>
                                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{item.viewCount} views</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* API Token Section - Glass Card */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </span>
                                Developer API
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">
                                Use this token to connect the DayOS Browser Extension. Treat this like a password.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={loadingToken}
                            className="shrink-0 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loadingToken ? 'Generating...' : token ? 'Regenerate Key' : 'Generate Key'}
                        </button>
                    </div>

                    {/* Token Field */}
                    <div className="group relative bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 px-4 py-3 font-mono text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 break-all min-w-0">
                                {token ? (showToken ? token : '•'.repeat(token.length > 20 ? 40 : token.length)) : 'No active token'}
                            </div>

                            {token && (
                                <div className="flex items-center gap-1 pr-1 flex-shrink-0">
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title={showToken ? "Hide" : "Show"}
                                    >
                                        {showToken ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Copy"
                                    >
                                        {copied ? (
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Guide */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="https://github.com/Snag-hub/unnamed_tool/blob/main/EXTENSION_GUIDE.md" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">Setup Guide</p>
                                <p className="text-zinc-500 text-xs">How to install & connect</p>
                            </div>
                        </a>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">Status</p>
                                <p className="text-zinc-500 text-xs">{token ? 'Ready to connect' : 'Key required'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* General Reminders Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </span>
                            Smart Reminders
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                            Quickly set personal reminders or habits. We'll email you when it's time.
                        </p>
                    </div>

                    {/* Quick Add Form */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 mb-6 border border-zinc-100 dark:border-zinc-800/50 transition-all focus-within:ring-2 focus-within:ring-purple-500/10">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Remind me to..."
                                value={reminderTitle}
                                onChange={(e) => setReminderTitle(e.target.value)}
                                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-all placeholder:text-zinc-400"
                            />
                            <input
                                type="datetime-local"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="sm:w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all text-zinc-600 dark:text-zinc-300"
                            />

                            <select
                                value={recurrence}
                                onChange={(e) => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all text-zinc-600 dark:text-zinc-300"
                            >
                                <option value="none">One-time</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>

                            {editingId ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddQuickReminder}
                                        disabled={!reminderTitle || !reminderTime || addingReminder}
                                        className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium text-sm rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                    >
                                        {addingReminder ? 'Updating...' : 'Update'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-sm rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddQuickReminder}
                                    disabled={!reminderTitle || !reminderTime || addingReminder}
                                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-500/10"
                                >
                                    {addingReminder ? 'Setting...' : 'Set Reminder'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Reminders List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 pl-1">Run Sheet</h3>

                        {loadingReminders ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : generalReminders.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800/50">
                                <div className="text-zinc-300 dark:text-zinc-600 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No active reminders.</p>
                            </div>
                        ) : (
                            generalReminders.map((reminder) => (
                                <div key={reminder.id} className={`group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border ${editingId === reminder.id ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/10' : 'border-zinc-100 dark:border-zinc-800'} rounded-xl hover:border-purple-200 dark:hover:border-purple-900/50 transition-all shadow-sm`}>
                                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => handleEdit(reminder)}>
                                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{reminder.title}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                                                <span>Due: <span className="text-zinc-700 dark:text-zinc-300">{new Date(reminder.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${reminder.recurrence !== 'none' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                                    {reminder.recurrence === 'none' ? 'One-time' : reminder.recurrence}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(reminder)}
                                            className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteReminder(reminder.id); }}
                                            className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>


            {/* Extension Download Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                        <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 p-1.5 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </span>
                        Extension
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl border border-sky-100 dark:border-sky-800/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm text-2xl">
                                🧩
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    DayOS Browser Extension
                                    <span className="px-2 py-0.5 text-xs bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full">v1.1</span>
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Save links and set reminders directly from your browser.</p>
                            </div>
                        </div>


                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="/dayos-extension.zip"
                                download
                                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors shadow-lg shadow-sky-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download (Chrome/Edge)
                            </a>
                            <a
                                href="/dayos-extension-firefox.zip"
                                download
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" /></svg>
                                Download for Firefox
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Data & Privacy Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-4 sm:p-8">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        </span>
                        Data & Privacy
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <p className="font-medium text-zinc-900 dark:text-white">Export Your Data</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Download a copy of all your tasks, notes, and items in JSON format.</p>
                        </div>
                        <a
                            href="/api/user/export"
                            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download JSON
                        </a>
                    </div>
                </div>
            </section>

        </div >
    );
}
