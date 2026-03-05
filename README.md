# 🦀 Mission Control v6

**Jake's AI-powered life & business command centre.**

Built with Next.js 14, powered by OpenClaw, orchestrated by an AI team.

## The Team

| Agent | Role | Model | Accent |
|-------|------|-------|--------|
| 🦀 Margarita | Orchestrator | Claude Opus 4.6 | Gold #FFD700 |
| 🦀 Bish | Builder | Codex / GPT | Purple #A855F7 |
| 🦀 Doc | Researcher | GPT-4o | Green #16A34A |

## Pages

| Tab | Description | Status |
|-----|-------------|--------|
| 🏠 Teams | Agent command centre (default) | 🔨 Building |
| 📋 Plans | Company tracking (Live/Pipeline/Archived) | ✅ Live |
| 🧠 Brain | Memory management, voice notes, search | ✅ Live |
| 📄 Docs | The Vault — document filing cabinet | 🔨 Building |
| 📦 Belongings | Photo-based inventory system | 🔨 Building |
| 📸 Capture | Quick capture & upload | ✅ Live |
| ⚙️ System | Costs, gateway, cron, channels | ✅ Partial |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Animations:** Framer Motion
- **Charts:** SVG (no chart libraries)
- **AI Providers:** Anthropic (Claude), OpenAI (GPT/Whisper/Vision), Moonshot (Kimi)
- **Database:** Supabase
- **Deployment:** Production build on port 3001

## Running

```bash
npm install
npm run build
npx next start -p 3001
```

## Architecture

- **Cost tracking:** Self-logging via POST `/api/costs` + provider API supplements
- **Memory:** Supabase-first with local `.md` file fallback
- **Voice notes:** OpenAI Whisper API
- **Video description:** GPT-4o Vision + Whisper
- **Brain sync:** Kimi K2.5 for cheap categorisation
- **Builder agent:** Codex CLI spawned for coding tasks

## Design

- Dark mode default (light/dark toggle)
- Bloomberg terminal meets gaming aesthetic
- Gold, purple, green accent colours
- Mobile responsive (accessed via Meshnet)
- No extra npm dependencies for charts/UI

---

*Built by Jake Lee & the crab team 🦀*
