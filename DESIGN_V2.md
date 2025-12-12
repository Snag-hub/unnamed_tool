# Read Later - Version 2.0 Design Document

## 1. Core Philosophy
Transform the application from a simple link saver into a **Personal Content Operating System**. The focus is on "Intentional Consumption" — helping users not just save content, but actually read/watch it through smart reminders and a beautiful, distraction-free interface.

## 2. Feature Scope

### A. Enhanced Item Management
We will expand the data model to support a complete lifecycle for content:
- **Inbox**: The landing zone for new items.
- **Reading/Watching**: Items currently in progress.
- **Archive (Read)**: Items finished but kept for history.
- **Favorites (Never Delete)**: A special collection of "Hall of Fame" content.
- **Trash**: Soft-delete area (recoverable for 30 days).

**New Metadata Capabilities:**
- **Smart Extraction**: Better handling of YouTube videos (duration, channel), Twitter threads, and article reading time.
- **Tags/Categories**: Organize content by topic.

### B. Reminder & Notification System
A robust engine to ensure content isn't forgotten.

**1. Item-Based Reminders**
- "Remind me in 1 hour / Tomorrow / Next Week"
- "Remind me on [Specific Date/Time]"

**2. General Reminders (Habit Building)**
- **Daily Digest**: "You have 3 articles saved for today."
- **Weekly Review**: "You saved 15 items this week. Time to curate?"

**3. Notification Channels**
- **Web/PWA Push**: Native notifications on Android and Desktop.
- **Email (Mailjet)**: Beautiful HTML email summaries.

### C. Import/Export
- **Import**: Bulk import URLs (text area) or CSV (from Pocket/Instapaper).
- **Export**: Download data as JSON/CSV.

### D. "Best Frontend Design" (UI/UX)
Moving away from a simple list to a **Dashboard Layout**.

**Layout Structure:**
- **Sidebar Navigation**: Inbox, Today, Upcoming, Favorites, Archives, Settings.
- **Main Content Area**:
    - **Masonry/Grid View**: Visually rich cards for articles.
    - **List View**: Dense view for scanning.
    - **Reader Mode**: Distraction-free reading view (parsing content).

**Visual Polish:**
- **Glassmorphism**: Subtle blur effects on sidebars/modals.
- **Micro-interactions**: Smooth animations when checking off items, hovering cards.
- **Dark Mode 2.0**: Deep, high-contrast OLED friendly dark theme.

## 3. Technical Architecture Updates

### Database Schema Changes (`items` table)
- `status`: enum ('inbox', 'reading', 'archived', 'trash')
- `isFavorite`: boolean
- `reminderAt`: timestamp (for specific reminders)
- `siteName`: string (e.g., "YouTube", "Medium")
- `author`: string
- `duration`: integer (reading time in minutes)
- `tags`: jsonb/array

### Notification Engine
- **Cron Jobs**: Vercel Cron or GitHub Actions to trigger scheduled email/push checks.
- **Service Worker**: Enhanced for handling push events on Android/Web.

## 4. Implementation Roadmap (Proposed)

1.  **Database Upgrade**: Update schema for status, reminders, and metadata.
2.  **UI Overhaul**: Build the new Sidebar + Grid Layout shell.
3.  **Smart Metadata**: Improve the scraper to get Author, Site Name, and Duration.
4.  **Reminder Logic**: Implement the backend logic for scheduling.
5.  **Notification Integration**: Connect Mailjet and Web Push.
6.  **Import/Export**: Build the tools to get data in/out.

