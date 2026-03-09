# Teams Tab Rebuild — Animated Agent Rooms

## Overview
Replace the current static agent cards with an interactive **animated rooms view**. Cute characters (SVG/CSS) move between rooms based on their current activity. Click a character to see what they did.

## The Agents (updated roster)

### Marg (Gold #FFD700)
- **Role:** Orchestrator — manages everything
- **Character:** Cute girl character holding a cocktail glass 🍸
- **Style:** Warm gold glow, confident pose

### Doc (Green #16A34A)
- **Role:** Builder/Coder — builds websites and features
- **Character:** Smart character wearing a lab coat 🥼
- **Style:** Green glow, intellectual vibe. Named after a real doctor who passed away.

### Cindy (Purple #A855F7)
- **Role:** Executive Assistant — calendar, emails, organisation
- **Character:** Professional character with a clipboard/hat 📋
- **Style:** Purple glow, organised energy

## The Rooms (horizontal scrollable on mobile, grid on desktop)

### 🏠 Lobby
- Default/idle room — agents hang here when not doing anything
- Cozy waiting area vibe
- Background: soft ambient lighting

### 💻 Dev Room
- Where coding/building happens
- Background: screens, code on monitors
- Doc lives here mostly

### 📧 Comms Room
- Emails, calendar, messages, scheduling
- Background: mailboxes, calendar boards
- Cindy's main room

### 🧠 Brain Room
- Research, thinking, analysis, memory work
- Background: books, neural network patterns
- Where deep thinking happens

### 📊 Ops Room
- System monitoring, deployments, automation
- Background: dashboards, server racks
- Marg manages ops from here

## How It Works

### Character Movement
- Characters are small animated SVG/CSS sprites (~60-80px)
- Each character has idle animation (gentle bobbing/breathing)
- When an agent starts a task, their character smoothly slides to the relevant room
- When idle, they stay in the last room they worked in
- Movement is animated with Framer Motion (slide + slight bounce on arrival)

### Character Design (CSS/SVG — no external images)
Build each character as a simple SVG component:
- Round head, simple body, distinctive feature:
  - **Marg:** Gold hair/dress, holding a small cocktail glass, sparkle effects
  - **Doc:** Lab coat (white), maybe glasses, green accent
  - **Cindy:** Purple outfit, clipboard in hand, maybe a small hat/headband
- Keep them cute and minimal — think Tamagotchi meets Notion avatars
- Each has a coloured glow/shadow matching their accent colour
- Idle animation: gentle float/bob (CSS keyframes, 3s loop)
- Walking animation: simple side-to-side movement when transitioning rooms

### Room Layout
- **Desktop:** 5 rooms in a horizontal row, each as a card/panel with a background scene
- **Mobile:** Horizontal scroll, each room takes ~70% viewport width, snap scroll
- Each room has:
  - Room name + emoji at top
  - A "floor" area where characters stand
  - Subtle animated background elements (floating particles, blinking lights, etc.)
  - Slight parallax on hover (desktop)

### Click Interactions
- **Click a character** → opens a slide-up panel showing:
  - Character name, role, current status
  - "Currently in: [Room Name]"
  - Last 5 activities with timestamps (pulled from the API or hardcoded for now)
  - Provider + model info (e.g. "Running on Claude Opus")
  - Quick action button: "Send Task" (placeholder for now)
- **Click a room** → highlights it, shows which agents are inside

### Status Indicators
- Each character has a small status dot:
  - 🟢 Green pulse = Active (working on something)
  - 🟡 Yellow pulse = Thinking/Processing
  - ⚪ Grey = Idle
  - 🔴 Red = Error/Offline

### Header Strip (keep existing, update data)
- "3 agents online" (pull from gateway status if possible, else hardcoded)
- Active tasks count
- Today's cost (existing API call works)

### Live Activity Feed (keep below rooms, update with new agent names)
- Replace "Bish" with "Doc" in all references
- Add Cindy entries
- Make feed items show which room the action happened in

## Technical Notes
- All characters as React components with SVG/CSS (no external image files)
- Framer Motion for all animations (movement, hover, panel slides)
- Keep the existing dark theme (true black bg, neon accents)
- The rooms are decorative containers — the real data comes from the API routes
- For now, agent states can be hardcoded (we'll wire up real gateway status later)
- This replaces the entire TeamsTab.tsx component
- Mobile-first: rooms scroll horizontally, characters scale down

## Files to Create/Modify
- `src/components/tabs/TeamsTab.tsx` — complete rewrite
- `src/components/characters/MargCharacter.tsx` — Marg SVG character
- `src/components/characters/DocCharacter.tsx` — Doc SVG character  
- `src/components/characters/CindyCharacter.tsx` — Cindy SVG character
- `src/components/rooms/Room.tsx` — reusable room container
- `src/components/rooms/AgentDetailPanel.tsx` — click-to-view panel

## Quality
- Smooth 60fps animations
- No janky transitions
- Works beautifully on iPad (Jake's primary Mission Control device)
- Dark theme with glowing accents
- Fun but not childish — premium cute
