#!/bin/bash
# Setup 7/3 automated sprint for Mission Control v7
# Run this script to install the cron jobs

echo "Setting up Mission Control v7 automated build sprint..."

# Create plist for builder (every 7 minutes)
cat > ~/Library/LaunchAgents/com.mc.builder.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mc.builder</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/margaritabot/.openclaw/workspace-cindy/mission-control-v6/scripts/builder-cron.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>420</integer>
    <key>StandardOutPath</key>
    <string>/tmp/mc-builder.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mc-builder.log</string>
</dict>
</plist>
PLIST

# Create plist for witness (every 3 minutes)
cat > ~/Library/LaunchAgents/com.mc.witness.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mc.witness</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/margaritabot/.openclaw/workspace-cindy/mission-control-v6/scripts/witness-cron.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>180</integer>
    <key>StandardOutPath</key>
    <string>/tmp/mc-witness.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mc-witness.log</string>
</dict>
</plist>
PLIST

# Load the plists
launchctl load ~/Library/LaunchAgents/com.mc.builder.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.mc.witness.plist 2>/dev/null || true

echo "✅ Automation installed!"
echo "  Builder: every 7 minutes (420s)"
echo "  Witness: every 3 minutes (180s)"
echo ""
echo "Logs:"
echo "  tail -f /tmp/mc-builder.log"
echo "  tail -f /tmp/mc-witness.log"
