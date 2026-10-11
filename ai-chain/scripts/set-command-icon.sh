#!/usr/bin/env bash
# Re-apply FIDV launcher icons to both .command files (macOS Finder).
# Git does not reliably keep Apple custom-icon resource forks — run after clone.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
ICNS="$ROOT/assets/fidv-launcher.icns"

if [[ ! -f "$ICNS" ]]; then
  echo "missing $ICNS" >&2
  exit 1
fi

osascript <<APPLESCRIPT
use framework "Foundation"
use framework "AppKit"
set icnsPath to "$ICNS"
set targets to {"$ROOT/Open-AI-Chain.command", "$REPO/Open-AI-Cube.command"}
set img to current application's NSImage's alloc()'s initWithContentsOfFile:icnsPath
if img is missing value then error "failed to load icns"
set ws to current application's NSWorkspace's sharedWorkspace()
repeat with t in targets
  ws's setIcon:img forFile:t options:0
end repeat
APPLESCRIPT

echo "[ai-chain] icons applied to Open-AI-Chain.command and Open-AI-Cube.command"
