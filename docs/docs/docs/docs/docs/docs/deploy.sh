#!/bin/bash
set -e

echo "🚀 Starting Ledger Deployment..."

# Step 1: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 2: Set MongoDB URI environment variable
echo "🔐 Configuring MongoDB connection..."
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI not set. Using local MongoDB."
    export MONGODB_URI="mongodb://localhost:27017"
fi

# Step 3: Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel --prod --env MONGODB_URI="$MONGODB_URI"

# Step 4: Deploy to GitHub Pages
echo "📄 Deploying to GitHub Pages..."
git checkout -b gh-pages || git checkout gh-pages
mkdir -p docs
cp index.html debug.html test.html docs/
cp -r css js images docs/ 2>/dev/null || true
git add docs/
git commit -m "Deploy frontend to GitHub Pages"
git push origin gh-pages
git checkout main || git checkout master

echo "✅ Deployment complete!"
echo "📍 Vercel URL: Check 'vercel env list' for deployment URL"
echo "📍 GitHub Pages: https://github.com/[username]/[repo]/settings/pages"
