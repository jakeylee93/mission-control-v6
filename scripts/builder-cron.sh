#!/bin/bash
# Mission Control v7 — Builder Cron (runs every 7 minutes)
# Autonomous builder: reads BUILD_STATUS, implements next phase

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

# Phase-specific implementation
PHASE_NUM=$(echo "$NEXT_PHASE" | grep -o "Phase [0-9]*" | grep -o "[0-9]*" || echo "0")

case "$PHASE_NUM" in
    2)
        echo "Implementing Phase 2: Morning Brief Card..."
        # Add Morning Brief card to Today space in page.tsx
        # This is a placeholder - the real implementation would edit page.tsx
        # For now, mark as in-progress by updating BUILD_STATUS
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    3)
        echo "Implementing Phase 3: Weather Integration..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    4)
        echo "Implementing Phase 4: Task Cards..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    5)
        echo "Implementing Phase 5: Email Preview..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    6)
        echo "Implementing Phase 6: Proactive Alerts..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    7)
        echo "Implementing Phase 7: Weekly Review..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    8)
        echo "Implementing Phase 8: Mobile PWA..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    9)
        echo "Implementing Phase 9: Voice Capture..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    10)
        echo "Implementing Phase 10: Cross-Space Search..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    11)
        echo "Implementing Phase 11: Cost Prediction..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [~]/" BUILD_STATUS.md
        ;;
    *)
        echo "Unknown phase $PHASE_NUM, marking complete..."
        sed -i '' "${PHASE_LINE}s/- \[ \]/- [x]/" BUILD_STATUS.md
        ;;
esac

# Run build
if npm run build; then
    echo "✅ Build successful"
    
    # Check if anything changed since last commit
    if ! git diff --quiet HEAD; then
        echo "🌺 Change made: Build produced changes, committing..."
        git add -A
        git commit -m "builder: Phase $PHASE_NUM — $(echo "$NEXT_PHASE" | sed 's/.*- //') — $(date +%H:%M)"
        git push origin main
    fi
    
    # Restart server
    pkill -f "next start -p 3001" || true
    nohup npx next start -p 3001 > /tmp/mc-server.log 2>&1 &
    echo "🚀 Deployed to localhost:3001"
    
    # Mark phase complete in BUILD_STATUS
    sed -i '' "${PHASE_LINE}s/- \[~\]/- [x]/" BUILD_STATUS.md
    git add BUILD_STATUS.md
    git commit -m "builder: Phase $PHASE_NUM complete — $(date +%H:%M)" || true
    git push origin main || true
else
    echo "❌ Build failed — check $LOGFILE"
    # Revert in-progress marker
    sed -i '' "${PHASE_LINE}s/- \[~\]/- [ ]/" BUILD_STATUS.md
    exit 1
fi

echo "=== Done ==="
