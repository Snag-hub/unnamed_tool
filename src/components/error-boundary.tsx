'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        console.error('Error Boundary caught an error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // TODO: Send error to monitoring service (Sentry)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error, {
        //         contexts: {
        //             react: {
        //                 componentStack: errorInfo.componentStack,
        //             },
        //         },
        //     });
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
                    <div className="max-w-md w-full">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                                    <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-2">
                                Something went wrong
                            </h1>

                            {/* Description */}
                            <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6">
                                We're sorry, but something unexpected happened. Don't worry, your data is safe.
                            </p>

                            {/* Error Details (Development only) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                    <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Error Details (Dev Only)
                                    </summary>
                                    <div className="text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-40">
                                        <p className="font-bold mb-2">{this.state.error.toString()}</p>
                                        {this.state.errorInfo?.componentStack && (
                                            <pre className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={this.handleReset}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </button>

                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reload Page
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Home className="w-4 h-4" />
                                    Go to Home
                                </button>
                            </div>

                            {/* Help Text */}
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
                                If this problem persists, please{' '}
                                <a
                                    href="mailto:support@dayos.snagdev.in"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    contact support
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
