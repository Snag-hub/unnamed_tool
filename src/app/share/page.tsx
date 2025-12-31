'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { createItem } from '../actions';
import { SignInButton, useUser, SignedOut } from '@clerk/nextjs';
import Image from 'next/image';

import { createNote } from '@/app/note-actions';

function ShareContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoaded, isSignedIn } = useUser();
    const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
    const [message, setMessage] = useState('');

    // Debug info
    const debugParams = {
        title: searchParams.get('title'),
        text: searchParams.get('text'),
        url: searchParams.get('url')
    };

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
                let targetUrl = url;
                let finalTitle = title || '';
                let finalDesc = text || '';

                // 1. Try to find a URL in the text if strictly text-url is missing
                if (!targetUrl && text) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const match = text.match(urlRegex);
                    if (match) {
                        targetUrl = match[0];
                    }
                }

                // 2. If we found a URL, save as ITEM
                if (targetUrl) {
                    const result = await createItem(targetUrl, finalTitle, finalDesc);
                    if (!result.success) {
                        throw new Error(result.message || 'Failed to save item');
                    }
                    setMessage('Saved as Item!');
                }
                // 3. If NO URL, but we have text/title, save as NOTE
                else if (finalDesc || finalTitle) {
                    await createNote({
                        title: finalTitle,
                        content: finalDesc || finalTitle // Fallback content
                    });
                    setMessage('Saved as Note!');
                }
                // 4. Nothing to save
                else {
                    throw new Error('No content found to save.');
                }

                setStatus('success');
                setTimeout(() => {
                    router.push('/inbox');
                }, 1500);
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'Failed to save item.');
            }
        };

        if (url || text || title) {
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
                    <p className="text-zinc-600 dark:text-zinc-400">Processing share...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <div className="text-green-500 text-4xl">✓</div>
                    <p className="text-lg font-medium text-zinc-900 dark:text-white">{message || 'Saved!'}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4 max-w-xs w-full">
                    <div className="text-red-500 text-4xl">!</div>
                    <p className="text-zinc-900 dark:text-white font-medium">{message}</p>

                    {/* Debug Parameters Display */}
                    <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-left text-xs font-mono overflow-hidden">
                        <p className="text-zinc-500 mb-1">Debug Info:</p>
                        <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
                            <p><span className="text-zinc-400">Title:</span> {debugParams.title || 'null'}</p>
                            <p><span className="text-zinc-400">Text:</span> {debugParams.text || 'null'}</p>
                            <p><span className="text-zinc-400">URL:</span> {debugParams.url || 'null'}</p>
                        </div>
                    </div>

                    {!isSignedIn && isLoaded && (
                        <div className="mt-4">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                                        Sign In
                                    </button>
                                </SignInButton>
                            </SignedOut>
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
