# Mission Control v6 — Build Status

**Started:** 2026-03-03 12:19 GMT
**Updated:** 2026-03-03 14:02 GMT

## Current Phase
✅ **LIVE on http://localhost:3001** — v6.3 (Real Cost Tracking)

## Completed

### v6.0 — Foundation
- [x] Project scaffold (Next.js 14 + Tailwind + Framer Motion)
- [x] Design system (true black, grain texture, neon yellow/purple)
- [x] Navigation component (tab switching, live clock)
- [x] DASH tab (Daily Snapshot, AI Team, Calendar, System Feed)
- [x] SYSTEM tab (AI Core metrics, APIs table, cost distribution)
- [x] PLANS tab (7 categories, ventures, add/edit/delete/status cycling)
- [x] API routes (activity, costs, agents, calendar, categories, chat)
- [x] Data adapters reading v2 data files directly
- [x] npm install complete
- [x] next build successful (clean compile)
- [x] Server running on port 3001

### v6.1 UI Redesign
- [x] **REMOVED Chat tab** — 3 tabs only: Dash, System, Plans
- [x] **Typography** — Inter (body) + Space Grotesk (headings)
- [x] **Color scheme** — CSS custom properties for day/night theming
- [x] **Night mode toggle** — top-right corner
- [x] **Navigation redesign** — modern iOS-style app navigation

### v6.2 Incremental Fixes
- [x] Light mode bug fixed — CSS variable overrides for all hardcoded dark-mode Tailwind classes
- [x] Typography modernised — Space Grotesk headings
- [x] Color scheme updated — Gold/Purple/Green accents
- [x] Navigation moved to TOP — Two-row fixed header
- [x] API Usage display improved — System tab shows real data

### v6.3 Calendar + Capture — 2026-03-03
- [x] **CALENDAR tab** (4th tab) — Full Google Calendar integration
  - Google OAuth 2.0 flow — popup-based connect button
  - Token storage: `memory/google-tokens.json`
  - Week view + Agenda list (toggle)
  - Multiple calendar support (Personal, Jobs, Bar People, etc.)
  - Calendar show/hide toggles in sidebar
  - Week navigation (prev/next week)
  - Next event shown in header + Daily Snapshot
  - Color-coded by calendar
- [x] **CAPTURE tab** (5th tab) — Thought capture queue
  - Textarea input: "What are you thinking?"
  - Category dropdown: Personal, Business (add custom)
  - Privacy toggle: Private / Shared
  - ⌘+Enter to submit
  - Queue stored in: `memory/capture/queue.json`
  - Live count: "X items queued for tonight"
  - Delete individual items or clear all
  - "How it works" explainer panel
- [x] **API routes added:**
  - GET `/api/calendar/auth` — generate OAuth URL
  - GET `/api/calendar/callback` — handle OAuth callback, save tokens
  - GET `/api/calendar/status` — check if connected
  - GET `/api/calendar/events` — fetch events from all calendars
  - GET/POST/DELETE `/api/capture` — manage capture queue
- [x] **Nightly processor:** `scripts/nightly-process.js`
  - Intent detection: calendar / task / philosophy / question / note
  - Calendar events → `memory/capture/calendar-pending.json`
  - Tasks → appended to `memory/plans/{category}.md`
  - Philosophy → `memory/philosophy/YYYY-MM-DD-HHMM.md`
  - Questions → flagged in morning report
  - Morning summary report: `memory/morning-report-YYYY-MM-DD.md`
  - Clears queue after processing
- [x] **Directories created:**
  - `memory/capture/` — queue.json
  - `memory/philosophy/` — dated thought files

## Architecture
- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS + CSS custom properties (day/night theme)
- **Typography:** Inter (body) + Space Grotesk (headings) — Google Fonts
- **Animation:** Framer Motion
- **Data:** API routes read same files as v2 (activity.json, plans/*.md, shared-chat.md)
- **Port:** 3001

## API Routes
| Route | Description |
|-------|-------------|
| GET/POST /api/activity | Activity log |
| GET /api/costs | Today's cost split Brain/Muscles |
| GET /api/agents | Agent status |
| GET /api/calendar-events | Local calendar.json (fallback) |
| GET /api/calendar/auth | Google OAuth URL |
| GET /api/calendar/callback | OAuth token exchange |
| GET /api/calendar/status | Connection status |
| GET /api/calendar/events | Live Google Calendar data |
| GET/POST/DELETE /api/capture | Capture queue CRUD |
| GET /api/categories | All category plans |
| POST /api/categories/[cat]/plans | Add plan |
| PUT/DELETE /api/categories/[cat]/plans/[id] | Update/delete plan |
| GET /api/apis-status | Services status |

## Cron Job Setup
The nightly processor cannot be auto-installed in this environment.
Run manually to set up:

```bash
# Install 1 AM cron job
bash cron_jobs/setup-nightly-cron.sh

# Or add manually to crontab -e:
0 1 * * * /usr/local/bin/node /Users/margaritabot/.openclaw/workspace/scripts/nightly-process.js >> /Users/margaritabot/.openclaw/workspace/logs/nightly-process.log 2>&1

# Test it now:
node scripts/nightly-process.js
```

## Google Calendar Setup
1. Go to **Calendar tab** → click "Connect with Google"
2. OAuth popup opens — sign in with Google
3. Allow Calendar read access
4. Popup closes, events load automatically
5. If OAuth fails: add `http://localhost:3001/api/calendar/callback` as authorized redirect URI in Google Cloud Console → APIs → Credentials → Edit OAuth client

### v6.3 Real API Cost Tracking — 2026-03-03
- [x] **POST /api/costs** — log real API calls with token counts
- [x] **GET /api/costs** — reads from `memory/costs/daily.json` (resets each day)
- [x] **Pricing table:** Kimi (8k/32k/128k) + Claude (Haiku/Sonnet/Opus) → cost in £
- [x] **System tab** — recent API calls table + cost distribution bars with token breakdown
- [x] **Dash tab** — "AI Compute Today: £X.XX" shows real cost from daily.json
- [x] **`scripts/log-cost.sh`** — CLI helper: `./scripts/log-cost.sh claude-sonnet-4-6 12500 3200`
- [x] **`api.logCost()`** — frontend helper for in-app cost logging
- [x] **`memory/costs/daily.json`** — stores entries + totals, auto-resets at midnight

#### How to log costs (from any script):
```bash
curl -X POST http://localhost:3001/api/costs \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","agent":"Martini","task":"Task name","inputTokens":12500,"outputTokens":3200}'
```

## Next Steps
- [ ] Google Calendar CREATE event from capture (calendar-pending.json → API call)
- [ ] Drag-to-reorder plans
- [ ] WebSocket chat reinstatement (if needed)
