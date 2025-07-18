#!/bin/bash

# Fix webpack cache issues script
# This script resolves common webpack cache problems in Next.js

echo "🔧 Fixing webpack cache issues..."

# Stop any running processes
echo "Stopping any running development servers..."
pkill -f "next dev" 2>/dev/null || true

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Clear node_modules cache
echo "Clearing node_modules cache..."
rm -rf node_modules/.cache

# Clear webpack cache
echo "Clearing webpack cache..."
rm -rf .webpack 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# Clear TypeScript build info
echo "Clearing TypeScript build info..."
rm -rf *.tsbuildinfo 2>/dev/null || true

# Clear logs
echo "Clearing old logs..."
rm -rf logs/*.log 2>/dev/null || true

# Clear pnpm cache (optional)
echo "Clearing pnpm cache..."
pnpm store prune 2>/dev/null || true

echo "✅ Cache cleared successfully!"
echo ""
echo "Now you can run:"
echo "  pnpm dev        - Start development server"
echo "  pnpm dev:debug  - Start with debug logging"
echo ""
echo "If webpack cache issues persist, try:"
echo "  pnpm install    - Reinstall dependencies"
echo "  rm -rf node_modules && pnpm install  - Full reinstall"