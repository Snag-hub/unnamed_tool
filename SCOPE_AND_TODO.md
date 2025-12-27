# DayOS: Scope & Master Plan

## 🗺 Roadmap

### ✅ Phase 0: Stabilization (COMPLETE!)
**Goal:** Make the system boringly reliable.
- [x] **Failure Handling**:
    - [x] Robust Metadata Fetching (Graceful fallbacks for missing OG tags).
    - [x] Notification Failure Logging (Detect silent failures).
- [x] **Idempotency**: Prevent duplicate URL saves.
- [x] **Edit Capability**: Allow editing Titles/Times of saved items.
- [x] **Analytics**: Basic internal tracking (Saved Count, Read Count).

### ✅ Phase 1: Tasks (Action Layer) (COMPLETE!)
**Goal:** Move from "Reading" to "Doing".
- [x] **Task Entity**: Create `tasks` schema (Title, Due Date, Type: Personal/Pro).
- [x] **Project Grouping**: Group tasks by Context/Project.
- [x] **Notification Integration**: Tasks fire notifications just like articles.
- [x] **Kanban/List View**: Pending -> In Progress -> Done.

### ✅ Phase 2: Meetings (Commitment Layer) (COMPLETE!)
**Goal:** granular time-blocking methods.
- [x] **Meeting Entity**: Title, Start/End Time, Link.
- [x] **Prep Reminders**: 
    - [x] Defaults: 1d, 1h, 30m, 10m, 5m, 2m before (Auto-created).
    - [x] Custom: Ability to add specific time-based reminders.
- [x] **Interview Mode**: Track stages (Screening, Tech, Offer).

### ✅ Phase 3: Notes (Knowledge Layer) (COMPLETE!)
**Goal:** Contextual storage.
- [x] **Markdown Editor**: Simple, fast note-taking with preview.
- [x] **Full-text Search**: Instant retrieval of thoughts.
- [x] **Database Schema**: Support for standalone and attached notes.

### ✅ Phase 4: The Timeline (The Soul) (COMPLETE!)
**Goal:** The Unified View.
- [x] **Timeline UI**: Daily Timeline showing all events chronologically.
- [x] **Time-Blocking**: Visual time blocks and free time calculation.
- [x] **Quick Actions**: Mark tasks done, archive items from timeline.
- [x] **Mobile Optimized**: Responsive design with no overflow.

### � Phase 5: Robustness & Hardening (In Progress)
**Goal:** Industrial-grade stability.
- [ ] **Automated Testing**: Unit (Vitest) + E2E (Playwright).
- [ ] **Type-Safe API**: Zod validation for all inputs.
- [ ] **Rate Limiting**: Protection for extension endpoints.

### 🚀 Phase 6: Power User Features (Backlog)
**Goal:** Superior experience.
- [ ] **Reader Mode**: Distraction-free content reading.
- [ ] **Omnisearch**: Search everything via Cmd+K.
- [ ] **Tagging**: Global organization system.
- [ ] **Batch Actions**: Multi-select and bulk archive.

---

## 📝 Status: EXPANDING Roadmap 🏗️
