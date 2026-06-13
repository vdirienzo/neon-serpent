#!/usr/bin/env bash
# Serve neon-serpent.html via local HTTP (needed because ES module imports
# of three.js don't work over file:// in modern browsers).
set -e
PORT="${PORT:-8765}"
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🐍 NEØN SERPENT — local server"
echo "   http://localhost:${PORT}/index.html"
echo "   (Ctrl+C to stop)"
cd "$DIR"
python3 -m http.server "$PORT"
