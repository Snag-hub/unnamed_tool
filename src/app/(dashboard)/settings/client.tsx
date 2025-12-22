
'use client';

import { generateApiToken } from './actions';
import { getGeneralReminders, addReminder, deleteReminder, updateReminder } from '@/app/actions';
import { useState, useEffect } from 'react';
import { ReminderScheduler } from '@/components/reminder-scheduler';
import { InferSelectModel } from 'drizzle-orm';
import { reminders } from '@/db/schema';


type Reminder = InferSelectModel<typeof reminders>;

export default function SettingsClient({ apiToken, userId }: { apiToken?: string | null; userId: string }) {
    // Token State
    const [token, setToken] = useState(apiToken);
    const [loadingToken, setLoadingToken] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showToken, setShowToken] = useState(false);

    // Reminder State
    const [generalReminders, setGeneralReminders] = useState<Reminder[]>([]);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderTime, setReminderTime] = useState('');
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
                await updateReminder(editingId, dateObj, 'none', reminderTitle);
                setEditingId(null);
            } else {
                await addReminder(dateObj, 'none', undefined, reminderTitle);
            }

            await loadReminders();
            setReminderTitle('');
            setReminderTime('');
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

        // Scroll to form (optional UX)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setReminderTitle('');
        setReminderTime('');
    };

    const handleDeleteReminder = async (id: string) => {
        if (confirm('Are you sure you want to delete this reminder?')) {
            setGeneralReminders(prev => prev.filter(r => r.id !== id)); // Optimistic
            await deleteReminder(id);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage your API access and preferences.</p>
            </div>

            {/* API Token Section - Glass Card */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-6 sm:p-8">
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
                        <div className="flex items-center">
                            <div className="flex-1 px-4 py-3 font-mono text-sm text-zinc-600 dark:text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                                {token ? (showToken ? token : '•'.repeat(token.length > 20 ? 40 : token.length)) : 'No active token'}
                            </div>

                            {token && (
                                <div className="flex items-center gap-1 pr-1">
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

            {/* Push Notification Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </span>
                                Push Notifications
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">
                                Get instant alerts for your smart reminders directly on your device.
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!('serviceWorker' in navigator)) return alert('Service Worker not supported');

                                const perm = await Notification.requestPermission();
                                if (perm !== 'granted') return alert('Permission denied');

                                try {
                                    const registration = await navigator.serviceWorker.ready;
                                    const sub = await registration.pushManager.subscribe({
                                        userVisibleOnly: true,
                                        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                                    });

                                    // Dynamically import to avoid server-side issues if any

                                    const { savePushSubscription: saveSub } = await import('@/app/actions');

                                    await saveSub(JSON.stringify(sub));
                                    alert('Subscribed to notifications!');
                                } catch (e) {
                                    console.error(e);
                                    alert('Failed to subscribe: ' + e);
                                }
                            }}
                            className="shrink-0 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Enable Notifications
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const registration = await navigator.serviceWorker.ready;
                                    const sub = await registration.pushManager.getSubscription();
                                    if (!sub) return alert('Enable notifications first!');

                                    const { sendTestNotification } = await import('@/app/actions');
                                    await sendTestNotification(JSON.stringify(sub));
                                    alert('Test sent! Check your notifications.');
                                } catch (e) {
                                    console.error(e);
                                    alert('Test failed: ' + e);
                                }
                            }}
                            className="shrink-0 px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-sm font-medium transition-colors"
                        >
                            Send Test
                        </button>
                    </div>

                    {/* Debug Info */}
                    <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl font-mono text-xs text-zinc-500 overflow-x-auto">
                        <p className="font-bold mb-2">Debug Info:</p>
                        <ul className="space-y-1">
                            <li>Supported: {'serviceWorker' in navigator && 'PushManager' in window ? 'Yes' : 'No'}</li>
                            <li>Permission: {typeof Notification !== 'undefined' ? Notification.permission : 'Unknown'}</li>
                            <li>HTTPS: {typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Yes' : 'No (Required for Push)'}</li>
                            <li>VAPID Public Key: {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Present' : 'Missing (Check Env Vars)'}</li>
                        </ul>
                        <button
                            onClick={async () => {
                                if ('serviceWorker' in navigator) {
                                    const regs = await navigator.serviceWorker.getRegistrations();
                                    for (let reg of regs) {
                                        await reg.unregister();
                                    }
                                    alert('Service Workers Unregistered. Reloading...');
                                    window.location.reload();
                                }
                            }}
                            className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
                        >
                            Hard Reset Service Worker
                        </button>
                    </div>
                </div>
            </section>

            {/* General Reminders Section */}
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-sm">
                <div className="p-6 sm:p-8">
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
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                Due: <span className="text-zinc-700 dark:text-zinc-300">{new Date(reminder.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
        </div>
    );
}
