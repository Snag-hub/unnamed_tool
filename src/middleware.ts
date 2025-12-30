import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/inbox(.*)',
  '/settings(.*)',
  '/tasks(.*)',
  '/meetings(.*)',
  '/notes(.*)',
  '/timeline(.*)',
  '/tags(.*)',
  '/archive(.*)',
  '/favorites(.*)',
  '/trash(.*)',
  '/reader(.*)',
  '/share(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();

    // If user is logged in and trying to access landing page, redirect to inbox
    if (userId && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/inbox', req.url));
    }

    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  } catch (error) {
    console.error('Middleware internal error:', error);
    // You might want to return a specific error response here or let Next.js handle it types
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};