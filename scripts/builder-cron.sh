#!/bin/bash
# Mission Control v7 — Builder Cron (runs every 7 minutes)
# Picks next phase, builds, commits, deploys

set -e

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
PHASE=$(grep -n "\[ \]" BUILD_STATUS.md | head -1)

if [ -z "$PHASE" ]; then
    echo "✅ All phases complete. Nothing to build."
    exit 0
fi

echo "Next phase: $PHASE"

# Run build
if npm run build; then
    echo "✅ Build successful"
    
    # Check if anything changed since last commit
    if ! git diff --quiet HEAD; then
        echo "🌺 Change made: Build produced changes, committing..."
        git add -A
        git commit -m "builder: $(echo "$PHASE" | sed 's/.*\[ \] //') — $(date +%H:%M)"
        git push origin main
    fi
    
    # Restart server
    pkill -f "next start -p 3001" || true
    nohup npx next start -p 3001 > /tmp/mc-server.log 2>&1 &
    echo "🚀 Deployed to localhost:3001"
else
    echo "❌ Build failed — check $LOGFILE"
    exit 1
fi

echo "=== Done ==="
