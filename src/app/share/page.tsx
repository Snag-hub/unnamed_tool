'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { createItem } from '../actions';
import { SignInButton, useUser } from '@clerk/nextjs';
import Image from 'next/image';

function ShareContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoaded, isSignedIn } = useUser();
    const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
    const [message, setMessage] = useState('');

    const title = searchParams.get('title');
    const text = searchParams.get('text');
    const url = searchParams.get('url');

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setStatus('error');
            setMessage('Please sign in to save items.');
            return;
        }

        if (!url) {
            setStatus('error');
            setMessage('No URL provided to save.');
            return;
        }

        const save = async () => {
            try {
                // Determine text/title priority
                // Many apps share date as text.
                const finalTitle = title || '';
                const finalDesc = text || '';

                await createItem(url, finalTitle, finalDesc);
                setStatus('success');
                setTimeout(() => {
                    router.push('/inbox');
                }, 1500);
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('Failed to save item. Please try again.');
            }
        };

        save();
    }, [isLoaded, isSignedIn, url, title, text, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-50 dark:bg-zinc-950 text-center">
            <div className="mb-6">
                <Image src="/icon-192.png" alt="DayOS" width={64} height={64} className="rounded-xl shadow-md" />
            </div>

            {status === 'saving' && (
                <div className="space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-zinc-600 dark:text-zinc-400">Saving to DayOS...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <div className="text-green-500 text-4xl">✓</div>
                    <p className="text-lg font-medium text-zinc-900 dark:text-white">Saved!</p>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4 max-w-xs">
                    <div className="text-red-500 text-4xl">!</div>
                    <p className="text-zinc-900 dark:text-white font-medium">{message}</p>
                    {!isSignedIn && isLoaded && (
                        <div className="mt-4">
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                                    Sign In
                                </button>
                            </SignInButton>
                        </div>
                    )}
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-zinc-500 underline hover:text-zinc-700 mt-4 block mx-auto"
                    >
                        Go Home
                    </button>
                </div>
            )}
        </div>
    );
}

export default function SharePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ShareContent />
        </Suspense>
    );
}
