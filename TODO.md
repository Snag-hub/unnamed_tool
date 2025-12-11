# Project TODO

This TODO list is based on the "Read-later Engine — Full Project Canvas.pdf" document.

## 1. Project Setup
- [x] Create project (`npx create-next-app@latest read-later --ts` and choose App Router, TypeScript, Tailwind, ESLint) - *Already done based on file structure.*
- [x] Install packages (`npm install next-auth @neondatabase/serverless drizzle-orm drizzle-kit open-graph-scraper node-fetch cookie next-pwa`)
- [ ] Configure `.env.local` with environment variables (DATABASE_URL, NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_SERVER, EMAIL_FROM, NEXTAUTH_URL)
- [ ] Setup Drizzle DB connection (`/db/index.ts`)
- [ ] Create schema (`/db/schema.ts`)
- [ ] Run Drizzle migrations (`npx drizzle-kit generate`, `npx drizzle-kit push`)
- [ ] Implement NextAuth route (`/app/api/auth/[...nextauth]/route.ts`)
- [ ] Protect API with middleware (`middleware.ts`)
- [ ] Basic save route (`/app/api/items/route.ts`)
- [ ] Inbox page (`/app/inbox/page.tsx`)

## 2. Metadata Extraction
- [ ] Implement metadata extraction (`/lib/metadata.ts`)

## 3. PWA & Share Target
- [ ] Place `manifest.webmanifest` under `/public`
- [ ] Implement share target handler (`/app/share/route.ts`)
- [ ] Service worker & caching strategy

## 4. Firefox Extension
- [ ] Create `manifest.json`
- [ ] Create `popup.html`
- [ ] Create `popup.js`

## 5. Deployment & Testing
- [ ] Create NeonDB project and database
- [ ] Create Vercel project and connect to GitHub repo
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure NextAuth providers callback URLs
- [ ] Configure PWA assets (icons) and publish
- [ ] Publish Firefox extension
- [ ] Test share target on Android
- [ ] Run drizzle migrations against Neon in production
- [ ] Local development setup (npm run dev, ngrok)
- [ ] Test authentication
- [ ] Test protected API routes
- [ ] Test browser extension
