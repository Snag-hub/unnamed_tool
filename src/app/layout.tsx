import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOs 4 DOERs",
  description: "Less planning. More doing.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Optional: prevents zooming on mobile inputs
};

import dynamic from "next/dynamic";

const Omnisearch = dynamic(() => import("@/components/omnisearch").then(mod => mod.Omnisearch));
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          logoBox: 'flex justify-center items-center',
          logoImage: 'h-12 w-12',
        },
        layout: {
          logoImageUrl: '/icon-192.png',
        },
        variables: {
          colorPrimary: '#00D4FF',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ErrorBoundary>
            <OfflineBanner />
            <Omnisearch />
            {children}
            <Toaster position="bottom-right" theme="system" />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
