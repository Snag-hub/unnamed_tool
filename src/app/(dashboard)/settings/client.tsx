'use client';

import { generateApiToken, deleteAccount } from './actions';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getGeneralReminders, addReminder, deleteReminder, updateReminder, updatePreferences } from '@/app/actions';
import { syncGoogleCalendar } from '@/app/calendar-actions';
import { useState, useEffect, ReactNode } from 'react';
import { InferSelectModel } from 'drizzle-orm';
import { reminders } from '@/db/schema';
import { toast } from 'sonner';

// --- Types ---
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

// --- Components ---

const SectionHeader = ({ icon, title, description }: { icon: ReactNode, title: string, description?: string }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
            {icon}
        </div>
        <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
            {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{description}</p>}
        </div>
    </div>
);

const SettingCard = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`group relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-zinc-300/50 dark:hover:border-zinc-700/50 ${className}`}>
        <div className="p-5 sm:p-6 md:p-8">
            {children}
        </div>
    </div>
);

const ToggleRow = ({ label, description, checked, onChange, color = "blue" }: { label: string, description: string, checked: boolean, onChange: () => void, color?: string }) => (
    <div className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1 pr-4">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{label}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>
        </div>
        <button
            onClick={onChange}
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 ${checked ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const ActionRow = ({ icon, label, description, action, buttonText, disabled = false, loading = false, variant = 'primary' }: { icon?: ReactNode, label: string, description?: string, action: () => void, buttonText: ReactNode, disabled?: boolean, loading?: boolean, variant?: 'primary' | 'secondary' | 'danger' }) => {
    const baseStyles = "px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 justify-center min-w-[100px]";
    const variants = {
        primary: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95 shadow-sm",
        secondary: "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-3 min-w-0">
                {icon && <div className="text-zinc-400 shrink-0">{icon}</div>}
                <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{label}</p>
                    {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>}
                </div>
            </div>
            <button
                onClick={action}
                disabled={disabled || loading}
                className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? <span className="animate-pulse">...</span> : buttonText}
            </button>
        </div>
    );
};

// --- Main Client Component ---

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
    // State
    const [token, setToken] = useState(apiToken);
    const [loadingToken, setLoadingToken] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(initialPreferences?.emailNotifications ?? true);
    const [pushEnabled, setPushEnabled] = useState(initialPreferences?.pushNotifications ?? true);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reminders State
    const [generalReminders, setGeneralReminders] = useState<Reminder[]>([]);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [addingReminder, setAddingReminder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            const data = await getGeneralReminders();
            setGeneralReminders(data);
        } catch (e) {
            console.error(e);
        }
    };

    // Actions
    const handleGenerateToken = async () => {
        setLoadingToken(true);
        try {
            const newToken = await generateApiToken(userId);
            setToken(newToken);
            toast.success('API Token generated');
        } catch (e) {
            toast.error('Failed to generate token');
        } finally {
            setLoadingToken(false);
        }
    };

    const handleCopyToken = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            toast.success('Token copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleTogglePreference = async (type: 'email' | 'push') => {
        const newValue = type === 'email' ? !emailEnabled : !pushEnabled;
        if (type === 'email') setEmailEnabled(newValue);
        else setPushEnabled(newValue);

        try {
            // Logic for Push Subscription
            if (type === 'push' && newValue === true) {
                console.log('🚀 [PUSH] Starting subscription process...');
                if (!('serviceWorker' in navigator)) {
                    console.error('❌ [PUSH] Service Worker not supported in this browser');
                    throw new Error('Service Worker not supported');
                }
                if (!('Notification' in window)) {
                    console.error('❌ [PUSH] Notifications not supported in this browser');
                    throw new Error('Notifications not supported');
                }

                console.log('📡 [PUSH] Requesting permission...');
                const perm = await Notification.requestPermission();
                console.log(`🔑 [PUSH] Permission result: ${perm}`);
                if (perm !== 'granted') {
                    throw new Error(`Permission ${perm}`);
                }

                console.log('⏳ [PUSH] Waiting for service worker ready...');
                const reg = await navigator.serviceWorker.ready;
                if (!reg) {
                    console.error('❌ [PUSH] Service Worker ready timed out or failed');
                    throw new Error('Service Worker not ready');
                }

                console.log('🧬 [PUSH] Creating push subscription via PushManager...');
                toast.loading('Creating push subscription...');

                try {
                    const sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
                    });
                    console.log('✅ [PUSH] Subscription success:', sub);

                    const { savePushSubscription } = await import('@/app/actions');
                    await savePushSubscription(JSON.stringify(sub));
                    console.log('💾 [PUSH] Saved to database');
                    toast.dismiss();
                    toast.success('Push notifications enabled!');
                } catch (subError: any) {
                    console.error('❌ [PUSH] reg.pushManager.subscribe failed:', subError);
                    toast.dismiss();
                    throw new Error(`Subscription failed: ${subError.message}`);
                }
            }

            await updatePreferences({
                emailNotifications: type === 'email' ? newValue : emailEnabled,
                pushNotifications: type === 'push' ? newValue : pushEnabled,
            });
            console.log(`✅ [PREF] Updated ${type} to ${newValue}`);
        } catch (e: any) {
            console.error('❌ [PREF] Update failed:', e);
            // Revert
            if (type === 'email') setEmailEnabled(!newValue);
            else setPushEnabled(!newValue);

            // Show specific error
            toast.error(e.message || 'Failed to update preference');
        }
    };

    const handleSaveReminder = async () => {
        if (!reminderTitle || !reminderTime) return;
        setAddingReminder(true);
        try {
            const dateObj = new Date(reminderTime);
            if (editingId) {
                await updateReminder(editingId, dateObj, recurrence, reminderTitle);
                setEditingId(null);
                toast.success('Reminder updated');
            } else {
                await addReminder(dateObj, recurrence, undefined, reminderTitle);
                toast.success('Reminder set');
            }
            await loadReminders();
            setReminderTitle('');
            setReminderTime('');
            setRecurrence('none');
        } catch (e) {
            toast.error('Failed to save reminder');
        } finally {
            setAddingReminder(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        setGeneralReminders(prev => prev.filter(r => r.id !== id));
        await deleteReminder(id);
        toast.success('Reminder deleted');
    };

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDeleteAccount = async () => {
        // Open the custom dialog instead of window.confirm
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteAccount = async () => {
        setIsDeleteDialogOpen(false);
        try {
            const toastId = toast.loading('Deleting account...');
            await deleteAccount();
            toast.dismiss(toastId);
            toast.success('Account deleted successfully');
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete account. Please try again.');
        }
    };

    // Helper

    // Helper
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

    return (
        <>
            <div className="mx-auto max-w-5xl w-full p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account and preferences.</p>
                    </div>
                    {/* Visual Flair only */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">

                        {/* Preferences */}
                        <SettingCard>
                            <SectionHeader
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                                title="Preferences"
                                description="Customize how DOs 4 DOERs interacts with you." />
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                <ToggleRow
                                    label="Email Notifications"
                                    description="Receive daily summaries and reminders."
                                    checked={emailEnabled}
                                    onChange={() => handleTogglePreference('email')}
                                />
                                <ToggleRow
                                    label="Push Notifications"
                                    description="Real-time alerts on this device."
                                    checked={pushEnabled}
                                    onChange={() => handleTogglePreference('push')}
                                />
                            </div>
                        </SettingCard>

                        {/* Reminders */}
                        <SettingCard>
                            <SectionHeader
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                title="Smart Reminders"
                                description="Quickly capture habits and to-dos." />
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3">
                                    <input
                                        value={reminderTitle}
                                        onChange={(e) => setReminderTitle(e.target.value)}
                                        placeholder="Remind me to..."
                                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" />
                                    <div className="flex gap-2">
                                        <input
                                            type="datetime-local"
                                            value={reminderTime}
                                            onChange={(e) => setReminderTime(e.target.value)}
                                            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-zinc-600 dark:text-zinc-400" />
                                        <button
                                            onClick={handleSaveReminder}
                                            disabled={!reminderTitle || !reminderTime || addingReminder}
                                            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                        >
                                            {addingReminder ? '+' : 'Add'}
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {generalReminders.length === 0 ? (
                                        <p className="text-center text-zinc-400 text-sm py-8 italic">No active reminders.</p>
                                    ) : (
                                        generalReminders.map(r => (
                                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800">
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{r.title}</p>
                                                    <p className="text-xs text-zinc-500">{new Date(r.scheduledAt).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => handleDeleteReminder(r.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </SettingCard>

                        {/* Danger Zone */}
                        <SettingCard className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                            <SectionHeader
                                icon={<svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                title="Danger Zone"
                                description="Irreversible account actions."
                            />
                            <div className="space-y-4">
                                <ActionRow
                                    label="Delete Account"
                                    description="Permanently remove your account and all data."
                                    buttonText="Delete Account"
                                    action={handleDeleteAccount}
                                    variant="danger" />
                            </div>
                        </SettingCard>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">

                        {/* Integrations */}
                        <SettingCard>
                            <SectionHeader
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                title="Integrations"
                                description="Connect external services." />
                            <div className="space-y-4">
                                <ActionRow
                                    label="Google Calendar"
                                    description="Sync your events to the timeline."
                                    buttonText="Sync Now"
                                    action={async () => {
                                        try {
                                            const res = await syncGoogleCalendar();
                                            toast.success(res.message);
                                        } catch (e) { toast.error('Sync failed'); }
                                    }}
                                    variant="secondary" />
                            </div>
                        </SettingCard>

                        {/* Extension */}
                        <SettingCard className="border-sky-100 dark:border-sky-900/30">
                            <SectionHeader
                                icon={<svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                                title="Browser Extension"
                                description="Save links and set reminders." />
                            <div className="flex flex-col gap-3">
                                <a
                                    href="/DOs 4 DOERs-extension.zip"
                                    download
                                    className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-sky-900 rounded-lg text-sky-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-zinc-900 dark:text-white">Download for Chrome/Edge</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">v1.1 • .zip package</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </a>
                                <a
                                    href="/DOs 4 DOERs-extension-firefox.zip"
                                    download
                                    className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-orange-900 rounded-lg text-orange-600">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" /></svg>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-zinc-900 dark:text-white">Download for Firefox</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">.xpi package</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </a>
                            </div>
                        </SettingCard>

                        {/* Developer */}
                        <SettingCard className="border-blue-100 dark:border-blue-900/30">
                            <SectionHeader
                                icon={<svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                                title="Developer Access"
                                description="Manage your API tokens." />
                            <div className="space-y-4">
                                <div className="p-3 bg-zinc-900 text-zinc-400 font-mono text-xs rounded-xl overflow-hidden relative group">
                                    <div className="break-all pr-8">
                                        {token ? (showToken ? token : '•'.repeat(Math.min(token.length, 32))) : 'No active token generated'}
                                    </div>
                                    <div className="absolute right-2 top-2 flex gap-1">
                                        {token && (
                                            <>
                                                <button onClick={() => setShowToken(!showToken)} className="p-1 hover:text-white transition-colors">{showToken ? 'Hide' : 'Show'}</button>
                                                <button onClick={handleCopyToken} className="p-1 hover:text-white transition-colors">Copy</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <a href="https://github.com/Snag-hub/unnamed_tool/blob/main/EXTENSION_GUIDE.md" target="_blank" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                        View Setup Guide
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                    <button
                                        onClick={handleGenerateToken}
                                        disabled={loadingToken}
                                        className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    >
                                        {loadingToken ? 'Generating...' : 'Regenerate Token'}
                                    </button>
                                </div>
                            </div>
                        </SettingCard>

                        {/* Stats */}
                        <SettingCard>
                            <SectionHeader
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                                title="Analytics" />
                            {initialStats && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center">
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{initialStats.totalSaved}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Saved</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center">
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{initialStats.totalRead}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Read</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center">
                                        <p className="text-2xl font-bold text-blue-600">{initialStats.readPercentage}%</p>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Rate</p>
                                    </div>
                                </div>
                            )}

                            {/* Most Viewed List */}
                            {initialStats && initialStats.mostViewed.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">Most Viewed</h3>
                                    <div className="space-y-2">
                                        {initialStats.mostViewed.map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                                            >
                                                {item.favicon ? (
                                                    <img src={item.favicon} alt="" className="w-5 h-5 rounded" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                                                        {item.title?.[0] || '?'}
                                                    </div>
                                                )}
                                                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors min-w-0">
                                                    {item.title || item.url}
                                                </span>
                                                <span className="text-xs font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                    {item.viewCount}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <a href="/api/user/export" className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Data Backup
                                </a>
                            </div>
                        </SettingCard>
                    </div>

                    {/* Legal & About */}
                    <div className="col-span-full">
                        <SettingCard>
                            <SectionHeader
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                title="Legal & About"
                                description="Privacy policy, terms of service, and app information" />

                            <div className="space-y-3">
                                <a
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">Privacy Policy</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">How we handle your data</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>

                                <a
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">Terms of Service</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Rules and guidelines</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>

                                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">DOs 4 DOERs v1.0</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Your personal knowledge hub</p>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href="/docs"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">User Guide</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Learn how to use features</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </SettingCard>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onCancel={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDeleteAccount}
                title="Delete Account"
                description="Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your data from our servers."
                confirmText="Delete Account"
                variant="danger"
            />
        </>
    );
}
