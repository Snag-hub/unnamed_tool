import { currentUser } from "@clerk/nextjs/server";
import { SignedOut, SignInButton as ClerkSignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Search, BookOpen, CheckCircle, Bell, Zap, Globe, Github, Twitter, Mail, ArrowRight, Shield, Command, Linkedin } from "lucide-react";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-100/50 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="Logo" width={32} height={32} className="rounded-lg shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">DayOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a>
            <Link href="/guide" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Guide</Link>
            <Link href="/extensions" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Extension</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/inbox"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                Open App
              </Link>
            ) : (
              <>
                <SignedOut>
                  <ClerkSignInButton mode="modal">
                    <button className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                      Log in
                    </button>
                  </ClerkSignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-95 shadow-lg shadow-black/10">
                      Get Started
                    </button>
                  </SignUpButton>
                </SignedOut>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-[500px] blur-[120px] opacity-30 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-1/2 h-full bg-blue-400 rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-1/4 w-1/2 h-full bg-indigo-400 rounded-full" />
          </div>

          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-3 py-1 text-xs font-bold text-blue-600 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap className="h-3 w-3 fill-current" />
              <span>v2.5: Unified Search & Reader Mode</span>
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-7xl !leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              The OS for your <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Digital Intelligence</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              DayOS bridges the gap between capture and action. Save everything, focus instantly with Reader Mode, and never miss a follow-up with intelligent reminders.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              {user ? (
                <Link
                  href="/inbox"
                  className="group rounded-2xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="group rounded-2xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 hover:-translate-y-1 active:scale-95 flex items-center gap-2">
                    Start Saving Now — Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignUpButton>
              )}
              <a href="#features" className="rounded-2xl border border-zinc-200 bg-white px-8 py-4 text-lg font-bold text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900">
                See Features
              </a>
            </div>

            {/* App Preview Mockup (Live CSS Version) */}
            <div className="mt-24 relative mx-auto max-w-6xl animate-in fade-in zoom-in duration-1000 delay-500 px-4">
              <div className="relative rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 backdrop-blur-sm overflow-hidden group">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-md h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center px-3 gap-2">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">dayos.snagdev.in/inbox</span>
                    </div>
                  </div>
                </div>
                {/* Mockup Content */}
                <div className="aspect-[16/10] bg-white dark:bg-black p-4 flex gap-4 overflow-hidden select-none pointer-events-none">
                  {/* Mock Sidebar */}
                  <div className="hidden sm:flex flex-col gap-6 w-48 border-r border-zinc-100 dark:border-zinc-900 pr-4">
                    <div className="h-8 w-24 bg-blue-600/10 rounded-lg" />
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-4 w-full rounded-md ${i === 1 ? 'bg-blue-600/20' : 'bg-zinc-100 dark:bg-zinc-900'}`} />
                      ))}
                    </div>
                  </div>
                  {/* Mock Grid */}
                  <div className="flex-1 space-y-8 min-w-0">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                        <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
                      </div>
                      <div className="h-8 w-24 bg-blue-600 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="rounded-2xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-3 space-y-3 shadow-sm transition-transform group-hover:translate-y-[-4px] duration-700" style={{ transitionDelay: `${i * 50}ms` }}>
                          <div className="aspect-video bg-zinc-50 dark:bg-zinc-900 rounded-xl" />
                          <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                          <div className="flex justify-between">
                            <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
                            <div className="h-2 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 dark:from-black/80 to-transparent pointer-events-none z-10" />

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-fit px-8 py-4 glass rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center gap-12 whitespace-nowrap overflow-x-auto no-scrollbar">
                  {[
                    { label: "Active Users", value: "200+" },
                    { label: "Items Saved", value: "15k+" },
                    { label: "Uptime", value: "99.9%" },
                    { label: "Read Rate", value: "65%" }
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl">Everything you need to <br className="hidden sm:block" /> focus and scale.</h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto italic font-medium">Built for knowledge workers who suffer from digital overload.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1: Reader Mode */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Kindle-Style Reader Mode</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                      Strip away ads, tracking, and distractions. DayOS extracts the "meat" of any article using Mozilla's Readability engine.
                    </p>
                  </div>
                  <div className="mt-8 relative h-48 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 drop-shadow-lg scale-90 sm:scale-100 transition-transform group-hover:scale-[1.02]">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-blue-500/20 rounded-full" />
                      <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                      <div className="h-3 w-[90%] bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                      <div className="h-3 w-[95%] bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                      <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                      <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Smart Notifications */}
              <div className="relative group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 shadow-inner group-hover:rotate-12 transition-transform">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Nudge, Don't Spam</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Intelligent follow-up loops. Get a clean email digest or web-push nudges when it’s time to read.
                </p>
              </div>

              {/* Feature 3: Omnisearch */}
              <div className="relative group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shadow-inner group-hover:scale-90 transition-transform">
                  <Command className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Universal Omnisearch</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Search across articles, tasks, meetings, and notes instantly with `Cmd+K`. Zero latency.
                </p>
              </div>

              {/* Feature 4: User Isolation */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8 dark:from-zinc-900 dark:to-black dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-inner">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Tested for Teams</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Invite your colleagues and friends! DayOS now supports full multi-user isolation. Your data is yours alone, encrypted at rest and protected by Clerk.
                    </p>
                  </div>
                  <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-12 w-12 rounded-full border-2 border-white dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-md">
                        <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" width={48} height={48} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About/CTA Section */}
        <section id="about" className="py-24 border-t border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6">
            <div className="relative rounded-3xl bg-zinc-900 dark:bg-white p-12 sm:p-20 overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/20 blur-[100px] pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-black text-white dark:text-black mb-6">Designed for the <br /> 1% of Doers.</h2>
                  <p className="text-zinc-400 dark:text-zinc-600 text-lg mb-8 leading-relaxed italic">
                    "Most productivity apps are just databases of regret. DayOS is the first time I actually feel in control of my reading queue."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full border border-white/20 overflow-hidden bg-zinc-800">
                      <Image src="https://github.com/Snag-hub.png" alt="Author" width={40} height={40} />
                    </div>
                    <div>
                      <p className="font-bold text-white dark:text-black leading-none">Snag-hub</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest font-bold">Creator of DayOS</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 dark:bg-black/5 rounded-2xl p-8 border border-white/10 dark:border-black/10 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white dark:text-black mb-4">Start your journey.</h3>
                  {user ? (
                    <Link
                      href="/inbox"
                      className="block w-full text-center rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
                    >
                      Launch Application
                    </Link>
                  ) : (
                    <SignUpButton mode="modal">
                      <button className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95 text-lg">
                        Create Account Free
                      </button>
                    </SignUpButton>
                  )}
                  <p className="mt-4 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-loose">
                    Free tier includes unlimited storage <br /> & basic notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-12 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="Logo" width={24} height={24} className="rounded-md" />
            <span className="text-lg font-black text-zinc-900 dark:text-white">DayOS</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 px-1 border border-zinc-200 dark:border-zinc-800 rounded">Beta</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-center sm:text-left">
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link>
            <Link href="/guide" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Guide</Link>
            <Link href="/extensions" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Extensions</Link>
            <a href="mailto:imsnag.1@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</a>
          </div>
          <div className="flex gap-6 items-center">
            <a href="https://x.com/therealgeelani" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-5 h-5 text-zinc-400 hover:text-blue-400 cursor-pointer transition-colors" />
            </a>
            <a href="https://github.com/Snag-hub" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors" />
            </a>
            <a href="https://linkedin.com/in/syednadeemhussain" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-5 h-5 text-zinc-400 hover:text-blue-700 cursor-pointer transition-colors" />
            </a>
            <a href="mailto:imsnag.1@gmail.com">
              <Mail className="w-5 h-5 text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors" />
            </a>
          </div>
        </div>
        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400/50">
          &copy; {new Date().getFullYear()} DayOS. Designed by Snag-hub.
        </div>
      </footer>
    </div>
  );
}
