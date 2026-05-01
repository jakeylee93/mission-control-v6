#!/bin/bash
# Mission Control v7 — Witness Cron (runs every 3 minutes)
# Read-only observer, reports progress to Discord

set -e

cd /Users/margaritabot/.openclaw/workspace-cindy/mission-control-v6

LOGFILE="/tmp/mc-witness-$(date +%Y%m%d-%H%M%S).log"
exec > "$LOGFILE" 2>&1

echo "=== MC Witness Cron — $(date) ==="

# Check git status
CHANGED=0
if ! git diff --quiet HEAD 2>/dev/null; then
    CHANGED=1
fi

# Check for unpushed commits
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')

# Read current phase
PHASE=$(grep -n "\[ \]" BUILD_STATUS.md | head -1 | sed 's/.*\[ \] //' || echo "All phases complete ✅")

# Check if server is running
SERVER_PID=$(pgrep -f "next start -p 3001" || echo "")

# Check last commit
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "No commits")

# Build report
if [ "$CHANGED" -eq 1 ] || [ "$UNPUSHED" -gt 0 ]; then
    echo "🌺 Change made:"
    echo "  Phase: $PHASE"
    echo "  Uncommitted: $CHANGED"
    echo "  Unpushed commits: $UNPUSHED"
    echo "  Server: $(if [ -n "$SERVER_PID" ]; then echo "running (pid $SERVER_PID)"; else echo "stopped"; fi)"
    echo "  Last commit: $LAST_COMMIT"
else
    echo "Witness update:"
    echo "  Phase: $PHASE"
    echo "  Server: $(if [ -n "$SERVER_PID" ]; then echo "running (pid $SERVER_PID)"; else echo "stopped"; fi)"
    echo "  Last commit: $LAST_COMMIT"
    echo "  Status: No changes since last check"
fi

echo "=== Done ==="
