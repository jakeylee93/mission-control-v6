#!/bin/bash
# Auto-commit and push to GitHub
# Usage: ./scripts/git-push.sh "optional commit message"
# If no message provided, generates one from git diff

cd "$(dirname "$0")/.." || exit 1

# Check for changes
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "✅ Nothing to commit — repo is clean"
  exit 0
fi

# Generate commit message from diff if none provided
if [ -n "$1" ]; then
  MSG="$1"
else
  # Count changes
  ADDED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
  MODIFIED=$(git diff --name-only | wc -l | tr -d ' ')
  STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
  
  # Get changed file names for context
  FILES=$(git diff --name-only; git ls-files --others --exclude-standard)
  
  # Build auto message
  MSG="🔄 Auto-commit: ${MODIFIED} modified, ${ADDED} new, ${STAGED} staged"
  
  # Add file hints
  if echo "$FILES" | grep -q "TeamsTab"; then MSG="$MSG | Teams"; fi
  if echo "$FILES" | grep -q "BrainTab"; then MSG="$MSG | Brain"; fi
  if echo "$FILES" | grep -q "PlansTab"; then MSG="$MSG | Plans"; fi
  if echo "$FILES" | grep -q "DocsTab"; then MSG="$MSG | Docs"; fi
  if echo "$FILES" | grep -q "BelongingsTab"; then MSG="$MSG | Belongings"; fi
  if echo "$FILES" | grep -q "SystemTab"; then MSG="$MSG | System"; fi
  if echo "$FILES" | grep -q "Navigation"; then MSG="$MSG | Nav"; fi
  if echo "$FILES" | grep -q "api/"; then MSG="$MSG | API"; fi
fi

git add -A
git commit -m "$MSG"
git push origin main

echo ""
echo "✅ Pushed to GitHub: $MSG"
echo "🔗 https://github.com/jakeylee93/mission-control-v6"
