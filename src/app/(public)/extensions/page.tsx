import Link from "next/link";
import { ArrowLeft, Chrome, Monitor, Zap, Shield, Download, Pin } from "lucide-react";
import { ChromeExtensionLink } from "@/components/chrome-extension-link";

export default function ExtensionsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="mx-auto max-w-4xl px-6 py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="mb-16">
                    <h1 className="text-5xl font-black mb-6 tracking-tight">Get the Extension</h1>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                        DayOS works best when it's just a click away. Save articles, set reminders, and capture inspiration directly from your browser.
                        Need help starting? Check our <Link href="/guide" className="text-blue-600 hover:underline">User Guide</Link>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {/* Firefox */}
                    <div className="group relative rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <Monitor className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Firefox</h3>
                        <p className="text-zinc-500 text-sm mb-8">Official build for Firefox users (XPI).</p>
                        <a
                            href="/24db911f6eb143cc8f61-1.0.xpi"
                            download
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                            <Download className="w-4 h-4" />
                            Download XPI
                        </a>
                    </div>

                    {/* Edge */}
                    <div className="group relative rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Edge</h3>
                        <p className="text-zinc-500 text-sm mb-8">Optimized V3 build for Microsoft Edge.</p>
                        <a
                            href="/dayos-extension-chromium.zip"
                            download
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500"
                        >
                            <Download className="w-4 h-4" />
                            Download Zip
                        </a>
                    </div>

                    {/* Chrome */}
                    <div className="group relative rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Chrome className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Chrome</h3>
                        <p className="text-zinc-500 text-sm mb-8">Direct download for Google Chrome users.</p>
                        <div className="w-full">
                            <ChromeExtensionLink />
                        </div>
                    </div>
                </div>

                {/* Installation Guide */}
                <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
                    <h2 className="text-3xl font-black mb-8">Manual Installation Guide</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                                    Download & Extract
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed pl-8">
                                    Download the zip file for your browser (Edge version works for Chrome too!) and extract it to a permanent folder on your computer.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                                    Enable Developer Mode
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed pl-8">
                                    Open your browser's extensions page (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">chrome://extensions</code>) and toggle the <strong>Developer mode</strong> switch in the top right.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                                    Load Extension
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed pl-8">
                                    Click <strong>Load unpacked</strong> and select the folder where you extracted the extension. That's it!
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">4</span>
                                    Pin for Easy Access
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed pl-8">
                                    Click the puzzle icon in your toolbar and pin DayOS so you can save pages instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                        Need help? <a href="mailto:imsnag.1@gmail.com" className="text-blue-600 hover:underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
