#!/usr/bin/env bash
# Quick deploy to Vercel via CLI (requires auth)
# Usage: ./scripts/deploy-vercel.sh [--prod]

set -e

cd "$(dirname "$0")/.."

echo "🎮 NEØN SERPENT — Vercel Deploy"
echo ""

# Build
echo "📦 Building for Vercel..."
npm run build:vercel

# Deploy
echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "Options:"
echo "  1. First-time setup: vercel login (opens browser)"
echo "  2. With token: VERCEL_TOKEN=xxx ./scripts/deploy-vercel.sh"
echo "  3. Drag-and-drop: upload dist/ to https://vercel.com/new"
echo ""

if [ -n "$VERCEL_TOKEN" ]; then
  vercel deploy --prebuilt --prod --yes --token "$VERCEL_TOKEN" \
    ${VERCEL_ORG_ID:+--scope "$VERCEL_ORG_ID"}
elif vercel whoami 2>/dev/null; then
  vercel deploy --prebuilt --prod --yes
else
  echo "❌ Not authenticated."
  echo ""
  echo "Run one of:"
  echo "  vercel login                  # interactive"
  echo "  VERCEL_TOKEN=xxx $0          # with token"
  echo ""
  echo "Or drag-and-drop the dist/ folder to https://vercel.com/new"
  exit 1
fi
