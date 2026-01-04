# Project Todos & Fixes

## 🚨 Critical Fixes
- [ ] **Duplicate Emails**: Fix the issue where users receive double daily digest emails at 17:59. Implement idempotency checks.
- [ ] **Phone Notifications**: Investigate why PWA push notifications are not working.
  - [ ] Check Service Worker registration.
  - [ ] Add "Send Test Notification" button in Settings for easier debugging.

## 🎨 UI/UX Improvements
- [ ] **Email Template**: Redesign the "Daily Digest" email to be cleaner, responsive, and visually appealing.
- [ ] **Danger Zone Visibility**: Investigate why the "Danger Zone" (Delete Account) section is missing for some users. Ensure consistent rendering.
- [ ] **Sidebar User Management**: Create a dedicated `UserManagement` component in the sidebar to replace the simple User Button, offering better access to profile/settings.

## 📝 Plan
1. **Research**: Analyze `cron/daily-digest`, `push-sw.js`, and `settings/client.tsx`.
2. **Implement**: 
   - Add DB check for `lastDigestSentAt` (or similar logic).
   - Create `UserManagement` component.
   - Refactor email HTML.
   - Verify Service Worker loading.
3. **Verify**: Test all changes locally and deploying to preview if possible.
