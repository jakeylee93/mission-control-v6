#!/bin/bash
# Mission Control v7 — Builder Cron (runs every 7 minutes)
# REAL autonomous builder: reads BUILD_STATUS, spawns AI agent to implement

set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd /Users/margaritabot/.openclaw/workspace-cindy/mission-control-v6

LOGFILE="/tmp/mc-builder-$(date +%Y%m%d-%H%M%S).log"
exec > "$LOGFILE" 2>&1

echo "=== MC Builder Cron — $(date) ==="

# Check git status for uncommitted changes
if ! git diff --quiet HEAD; then
    echo "🌺 Change made: Uncommitted changes detected, committing..."
    git add -A
    git commit -m "builder: auto-commit $(date +%H:%M)"
    git push origin main
fi

# Read BUILD_STATUS to find next phase
NEXT_PHASE=$(grep -n "^\- \[ \]" BUILD_STATUS.md | head -1 | sed 's/.*\[ \] //' || true)
PHASE_LINE=$(grep -n "^\- \[ \]" BUILD_STATUS.md | head -1 | cut -d: -f1 || true)

if [ -z "$NEXT_PHASE" ]; then
    echo "✅ All phases complete. Nothing to build."
    exit 0
fi

echo "Next phase (line $PHASE_LINE): $NEXT_PHASE"

# Mark as in-progress
sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md

echo "🌺 Implementing: $NEXT_PHASE"

# Spawn AI agent to implement this phase
# The agent will read the current code, make changes, and commit

PHASE_NUM=$(echo "$NEXT_PHASE" | grep -o "Phase [0-9]*" | grep -o "[0-9]*" || echo "0")

case "$NEXT_PHASE" in
    *"Morning Brief"*|*"Fetch calendar"*|*"Count tasks"*|*"Show AI spend"*|*"Display greeting"*|*"Style as prominent"*)
        TASK="Implement Morning Brief card in Mission Control v7. Edit src/app/page.tsx to add a Morning Brief card at the top of the Today space. The card should show: today's date, next calendar event, AI spend today, and a greeting. Style it as a prominent hero card with a subtle gradient background. Keep all existing functionality. Run npm run build after changes."
        ;;
    *"weather"*|*"Weather"*)
        TASK="Implement weather integration in Mission Control v7. Create src/app/api/weather/route.ts that returns mock weather data (temp, condition, forecast). Add a weather card to the Today space in src/app/page.tsx showing current temp and condition. Run npm run build after changes."
        ;;
    *"Task Cards"*|*"task"*)
        TASK="Implement task cards in Mission Control v7. Add a 'Tasks Due' card to the Today space in src/app/page.tsx. Read from existing plans data and show tasks due today or overdue. Run npm run build after changes."
        ;;
    *"Email"*|*"email"*)
        TASK="Implement email preview in Mission Control v7. Add an 'Unread Emails' card to the Today space in src/app/page.tsx showing mock email data (sender, subject). Run npm run build after changes."
        ;;
    *"Alerts"*|*"alert"*)
        TASK="Implement proactive alerts in Mission Control v7. Add an 'Alerts' card to the Today space in src/app/page.tsx. Show mock alerts like 'Meeting in 15 mins' or 'Task overdue'. Run npm run build after changes."
        ;;
    *)
        TASK="Implement the next phase in Mission Control v7: $NEXT_PHASE. Edit the relevant files in src/app/ and run npm run build. Keep all existing functionality."
        ;;
esac

# Write task file for agent to pick up
echo "$TASK" > /tmp/mc-builder-task.txt
echo "$NEXT_PHASE" > /tmp/mc-builder-phase.txt

echo "Task written to /tmp/mc-builder-task.txt"
echo "Phase: $NEXT_PHASE"
echo ""
echo "⚠️  IMPORTANT: The builder script cannot write TypeScript/React code."
echo "An AI agent (Cindy/Doc/Marg) needs to read /tmp/mc-builder-task.txt"
echo "and implement the phase manually."
echo ""
echo "To implement manually, run:"
echo "  cat /tmp/mc-builder-task.txt"

# Mark as needing implementation (don't auto-complete)
sed -i '' "${PHASE_LINE}s/- \[~\]/- [ ]/" BUILD_STATUS.md

echo "=== Done (waiting for AI agent) ==="
