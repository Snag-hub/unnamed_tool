# Project TODO

This TODO list is based on the "Read-later Engine — Full Project Canvas.pdf" document.

## 1. Project Setup
- [x] Create project (`npx create-next-app@latest read-later --ts` and choose App Router, TypeScript, Tailwind, ESLint) - *Already done based on file structure.*
- [x] Install packages (`npm install next-auth @neondatabase/serverless drizzle-orm drizzle-kit open-graph-scraper node-fetch cookie next-pwa`)
- [x] Configure `.env.local` with environment variables (DATABASE_URL, NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_SERVER, EMAIL_FROM, NEXTAUTH_URL)
- [x] Setup Drizzle DB connection (`/src/db/index.ts`)
- [x] Create schema (`/src/db/schema.ts`)
- [x] Run Drizzle migrations (`npx drizzle-kit generate`, `npx drizzle-kit push`)
- [x] Implement NextAuth route (`/src/app/api/auth/[...nextauth]/route.ts`)
- [x] Protect API with middleware (`src/middleware.ts`)
- [x] Basic save route (`/src/app/api/items/route.ts`)
- [x] Inbox page (`/src/app/inbox/page.tsx`)
- [x] Implement API token generation for extension authentication

## 1.5. Authentication Migration (COMPLETED ✅)
- [x] **Migrate from NextAuth to Clerk**
  - [x] Install Clerk packages (`@clerk/nextjs`)
  - [x] Set up Clerk account and get API keys
  - [x] Remove NextAuth configuration and dependencies
  - [x] Update database schema (remove account, session, verificationToken tables)
  - [x] Keep items table and link to Clerk user IDs
  - [x] Update all authentication checks throughout the app
  - [x] Reconfigure API token system to work with Clerk
  - [x] Update middleware to use Clerk's auth middleware
  - [x] Test sign in/sign out flow
  - [x] Verify user creation in database
  - [x] Test API token generation in /settings
  - [x] Test browser extension authentication with API tokens

## 2. Metadata Extraction
- [x] Implement metadata extraction (`/src/lib/metadata.ts`)

## 3. PWA & Share Target
- [x] Place `manifest.webmanifest` under `/public`
- [x] Implement share target handler (`/src/app/share/route.ts`)
- [x] Service worker & caching strategy

## 4. Firefox Extension
- [x] Create `manifest.json`
- [x] Create `popup.html`
- [x] Create `popup.js`

## 5. Deployment & Testing
- [ ] Create NeonDB project and database
- [ ] Create Vercel project and connect to GitHub repo
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure Clerk production environment
- [ ] Configure PWA assets (icons) and publish
- [ ] Publish Firefox extension
- [ ] Test share target on Android
- [ ] Run drizzle migrations against Neon in production
- [x] Local development setup (npm run dev, ngrok)
- [x] Test authentication
- [x] Test protected API routes
- [x] Test browser extension

# Phase 2: The "Elegant" Upgrade (V2.0)

## 2.1. Database & Core Logic (COMPLETED ✅)
- [x] **Schema Update**
    - [x] Add `status` enum (inbox, archived, trash)
    - [x] Add `isFavorite` (boolean)
    - [x] Add `reminderAt` (timestamp)
    - [x] Add `metadata` fields (siteName, favicon, author, duration/readingTime, type)
    - [x] Run migrations
- [x] **Enhanced Metadata Scraper**
    - [x] Improve `metadata.ts` to fetch Author and Site Name
    - [x] Add specific logic for YouTube (duration, channel name)
    - [x] Calculate estimated reading time for articles

## 2.2. UI/UX Overhaul ("Best Design")
- [ ] **App Shell Layout**
    - [ ] Create responsive Sidebar navigation (Inbox, Favorites, Later, Settings)
    - [ ] **Mobile Navigation Upgrade**:
        - [ ] Convert sidebar to bottom tab bar on mobile (WhatsApp style)
        - [ ] Limit to 4 main tabs (Idea: Inbox, Favorites, Archive, Search/Tags)
        - [ ] Move Settings and less used tabs to sidebar/drawer or "More" tab
        - [ ] Add User Profile icon (top-right) for Sign Out and Account Management
    - [ ] Implement "App Layout" component to wrap pages
- [ ] **Item Cards & Grid**
    - [ ] Design rich "Article Card" (Image, Title, Site, Time, Actions)
    - [ ] Design "Video Card" for YouTube (Play button overlay)
    - [ ] Implement Masonry or Responsive Grid layout
- [ ] **Interactions**
    - [ ] Add "Swipe to Archive" (mobile) or Hover Actions (desktop)
    - [ ] Add smooth transitions (Framer Motion or CSS)

## 2.3. Reminders & Notifications
- [ ] **Reminder System (Backend)**
    - [ ] Create API to set/update reminders
    - [ ] Implement cron job logic (check for due reminders)
- [ ] **Email Notifications (Mailjet)**
    - [ ] Configure Mailjet client
    - [ ] Design HTML email template for "Daily Digest"
    - [ ] Implement email sending logic
- [ ] **Push Notifications (Web/Android)**
    - [ ] Update Service Worker for `push` events
    - [ ] Implement VAPID key generation and subscription logic
    - [ ] Build "Enable Notifications" UI

## 2.4. Features & Polish
- [ ] **Import/Export**
    - [ ] Create "Import URLs" text area
    - [ ] Implement CSV import parser
- [ ] **Search & Filter**
    - [ ] Add search bar (client-side filtering first)
    - [ ] Add filters (Videos, Articles, Favorites)

## 2.5. Final Polish & Suggestions
- [ ] **Polishing**
    - [ ] Add official Favicon to website
    - [ ] Dynamic Web Page Titles (e.g. "Inbox (3) - DayOS")
    - [ ] **Dark Mode Assets**: Create specific icons/assets optimized for dark mode.
- [ ] **User Experience Improvements**
    - [ ] **Open Graph Tags**: Ensure sharing DayOS links looks good on social media.
    - [ ] **Custom PWA Install Button**: A visible "Install App" button.
    - [ ] **Keyboard Shortcuts**: 'A' to Archive, 'F' to Favorite, 'Del' to Trash.
    - [ ] **Dark Mode Toggle**: Manual switch for users who want different theme than OS.

