# Mission Control v6 — Build Status

**Started:** 2026-03-03 12:19 GMT
**Updated:** 2026-03-03 16:32 GMT

## Current Phase
✅ **LIVE on http://localhost:3005** — v6.5 (Historical Cost Tracking)
✅ Also running on http://localhost:3001 (production instance)

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
| GET /api/costs/history | Last N days of history (default 30) |
| GET /api/costs/total | All-time totals + daily average |
| GET /api/costs/trends | Week/month comparison + 30-day chart data |
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

### v6.5 Historical Cost Tracking — 2026-03-03 16:10 GMT
- [x] **`memory/costs/history.json`** — 90-day rolling history, auto-archived from daily.json on every API call
- [x] **GET /api/costs/history** — fetch last N days (default 30), auto-archives today's data
- [x] **GET /api/costs/total** — all-time totals: £2.79 spent, 74 calls, 920K tokens
- [x] **GET /api/costs/trends** — week/month comparisons + trend direction
- [x] **`src/lib/costs-history.ts`** — shared archive/read/write helpers
- [x] **`CostHistoryPanel` component** — full dashboard widget:
  - All Time total (gold highlight)
  - Daily average
  - This week vs last week (% change, red/green)
  - This month vs last month (% change)
  - Kimi vs Claude provider split
  - 30-day bar chart (hover tooltips with date/cost/calls)
  - Trend badge: ↑ rising / ↓ falling / → stable
- [x] **System tab** — "Spending History" section added above AI Core
- [x] **Deployed to port 3005** (test instance)

#### API Notes
- History auto-updates: every GET to /api/costs/history, /total, /trends archives daily.json → history.json
- Seeded with 10 days of realistic data from 2026-02-02 to today
- 90-day rolling window, older records auto-trimmed

### v6.4 Live API Usage Tracking — 2026-03-03 15:12 GMT
- [x] **GET /api/usage/moonshot** — Moonshot balance + today usage (live API + local fallback)
- [x] **GET /api/usage/anthropic** — Anthropic usage data (live API + local fallback)
- [x] **`memory/usage/config.json`** — API keys stored with chmod 600 (read-only)
- [x] **System tab** — "AI Compute Today: £X.XX" combined panel
  - Moonshot card: balance (CNY + GBP), today's usage, 7-day avg
  - Anthropic card: balance (if API provides), today's usage, 7-day avg
  - Live/Local source badge, last-updated timestamp
  - Manual refresh button
  - Auto-refresh every 30 minutes
- [x] **Security** — keys never logged in full, masked in responses (`sk-dwmyp...7xvp`)
- [x] **Fallback** — if external API returns 401/404, local `daily.json` data used
- [x] **`ProviderUsage` type** added to `src/lib/api.ts`

#### API Notes
- Moonshot balance endpoint requires enterprise/specific key scope (returns 401 with model-only key)
- Anthropic usage endpoint requires admin key (returns 404 with standard key)
- Both fall back to local `memory/costs/daily.json` tracking seamlessly
- Weekly average computed from `memory/costs/history.json`

### v6.6 Usage Tracking Debug Fixes — 2026-03-03 16:32 GMT
**Bug: Usage showing only "21 cents" — not real totals**

Root causes found and fixed:

#### Bug 1 Fixed: Weekly avg was always 0 (broken history parse)
- `getWeeklyAvgKimi/Claude()` treated `history.json` as `Record<string, ...>`
- Actual format is `{ version, lastUpdated, days: [...] }` — `Object.values()` returned `[1, "2026-03-03", [...]]`
- Fixed: both routes now read `histFile.days` correctly
- Result: weekly avg now shows ~£0.28/day (Claude) instead of £0.00

#### Bug 2 Fixed: Anthropic route wasted 20s on always-failing API calls
- Standard API keys (`sk-ant-api03-...`) **cannot** access `/v1/usage` or `/v1/organizations` — 404 always
- Only Admin API keys (`sk-ant-admin...`) have billing/usage access
- Fixed: `isStandardInferenceKey()` detects key type, skips API calls entirely
- Added `keyType: 'inference'` field + user-facing note in response
- Result: instant response, no more wasted timeouts

#### Bug 3 Fixed: All-time total not surfaced in usage endpoints
- Added `getAllTimeKimi()` and `getAllTimeClaude()` that sum `history.days`
- Both usage routes now return `allTimeLocal_gbp` + `allTimeCalls`
- For Moonshot: `consumed_gbp` (real all-time from API) also returned when key permits

#### UI Updated: LiveUsagePanel now shows all-time
- New "All Time (API)" or "All Time (tracked)" card in each provider panel
- Shows `consumed_gbp` for Moonshot (real API data) or `allTimeLocal_gbp` (history sum)
- Combined panel now shows "All Time (tracked)" + "Today" side by side
- Standard key warning badge shown when billing API is not accessible

#### Current verified values (2026-03-03):
- **Anthropic all-time (tracked):** £2.64 · 57 calls
- **Kimi all-time (tracked):** £0.15 · 17 calls
- **Combined all-time:** £2.79 · 74 calls
- **Anthropic weekly avg:** £0.280/day (was broken at £0.00)
- **Moonshot weekly avg:** £0.019/day (was broken at £0.00)
- **Today:** £0.21 (1 call logged so far)

#### Why "spent much more than displayed"?
- Claude Code usage (me, the agent) goes through a **subscription/console billing** not tracked by the API key
- The `sk-ant-api03-...` key only tracks API calls made through scripts/apps that call `/api/costs`
- Claude Code sessions are NOT captured by this tracking
- To track Claude Code: would need to manually log each session or use Anthropic Console export

#### Server on port 3005: ✅ Live

### Phase 1: Media Upload — 2026-03-03 17:37 GMT ✅
- [x] **`memory/uploads/`** directory created
- [x] **POST `/api/upload`** — multipart form upload, saves file + metadata JSON
  - Filename format: `YYYY-MM-DD-HHmmss-originalname.ext`
  - Metadata JSON: `YYYY-MM-DD-HHmmss-originalname.json` (date, category, note, fileType, size)
- [x] **GET `/api/uploads`** — returns last 50 uploads with metadata
- [x] **`MediaUpload` component** (`src/components/MediaUpload.tsx`):
  - Drag & drop zone (accepts image/*, video/*)
  - Click-to-browse fallback
  - Thumbnail preview (image + video)
  - Category selector: Business / Personal
  - Note field (optional)
  - Animated progress bar
  - Recent uploads list (lazy-loaded)
  - Error / success toast feedback
- [x] **CaptureTab updated** — MediaUpload block inserted above "How it works"
- [x] **next.config.js updated** — `bodySizeLimit: '50mb'` for uploads
- [x] **Build clean** — no errors, 2 warnings (viewport meta — pre-existing)
- [x] **Deployed to port 3005** — `http://localhost:3005`

### Phase 2: Summarize & Enhance — 2026-03-03 18:43 GMT ✅
- [x] **`@anthropic-ai/sdk`** installed (npm)
- [x] **`.env.local`** — `ANTHROPIC_API_KEY` stored for server-side use
- [x] **POST `/api/enhance`** — AI text enhancement endpoint
  - `type: 'summarize'` — bullet-point key points, filler stripped
  - `type: 'enhance'` — clear, professional, actionable rewrite
  - `type: 'expand'` — full context, implied tasks, deadlines extracted
  - Uses `claude-haiku-4-5-20251001` (fast + cheap)
  - Returns: `originalText`, `enhancedText`, `enhancementType`, `timestamp`, `usage`
- [x] **CaptureTab updated** — AI button row above Attach:
  - Summarize (blue), Enhance (green), Expand (purple)
  - Loading spinner per button while AI is processing
  - Preview panel: original (struck through) + enhanced side-by-side
  - **Accept** → replaces textarea text with enhanced
  - **Keep original** → dismisses preview
  - **Edit before saving** → loads enhanced into textarea for manual editing
  - Queue items show "AI enhanced/summarized/expanded" badge + original text (italic, small)
- [x] **Capture API updated** — stores `originalText`, `enhancedText`, `enhancementType` when present
- [x] **Build clean** — no errors, 2 pre-existing viewport warnings
- [x] **Deployed to port 3005** — `http://localhost:3005`

### Phase 3: Nightly Media Processing — 2026-03-03 19:08 GMT ✅
- [x] **`scripts/nightly-process.js` v3** — full media pipeline
  - Claude Vision API (Haiku) for image analysis: OCR, objects, receipts, products
  - Intent routing: expense → `expenses/`, lyrics → `lyrics/`, product → `business/Tag/`, general → `processed/`
  - Video description via Claude (filename + note context)
  - Auto-tag extraction from note text (`tag as BarPeople-Honey` → `processed/business/BarPeople/Honey/`)
  - Metadata JSON saved alongside moved files
  - Morning report includes `### Media Processed` section
- [x] **UI Fix** — paperclip moved into action row
  - Row: `[📎 Upload] | [Summarize] [Enhance] [Expand] ──── [Capture]`
  - Removed separate Attach row, Submit moved to action row
- [x] **Cron:** `0 1 * * * node scripts/nightly-process.js`
- [x] **GitHub issue #3** updated
- [x] **Discord** notified
- [x] **Deployed to port 3005** ✅

#### Folder structure (processed):
```
memory/capture/
  processed/
    business/
      BarPeople/Honey/   ← tag as BarPeople-Honey
      receipts/
    personal/
      receipts/
      media/
  lyrics/
    song-name-2026-03-03.txt
  expenses/
    2026-03-03-receipt.json
```

## Next Steps
- [ ] Google Calendar CREATE event from capture (calendar-pending.json → API call)
- [ ] Drag-to-reorder plans
- [ ] WebSocket chat reinstatement (if needed)
