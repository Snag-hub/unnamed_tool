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



        const save = async () => {
            try {
                // Determine text/title priority
                // Some browsers (Chrome Android) put URL in text field if not matching exact manifest param logic sometimes,
                // or if sharing a "text + url" combo.

                let targetUrl = url;
                let finalTitle = title || '';
                let finalDesc = text || '';

                // Fallback: Try to extract URL from text if url param is missing
                if (!targetUrl && text) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const match = text.match(urlRegex);
                    if (match) {
                        targetUrl = match[0];
                        // Optional: Remove URL from desc if we want clean text, but keeping it is fine.
                    }
                }

                if (!targetUrl) {
                    throw new Error('No URL found to save.');
                }


                await createItem(targetUrl, finalTitle, finalDesc);
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

        if (url || text) {
            save();
        } else {
            setStatus('error');
            setMessage('No content provided to save.');
        }

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
