#!/usr/bin/env pwsh

Write-Host "🚀 Starting Ledger Deployment..." -ForegroundColor Green

# Step 1: Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI..." -ForegroundColor Cyan
try {
    vercel --version | Out-Null
} catch {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Step 2: Set MongoDB URI
Write-Host "🔐 Configuring MongoDB connection..." -ForegroundColor Cyan
$mongoUri = $env:MONGODB_URI
if (-not $mongoUri) {
    Write-Host "⚠️  MONGODB_URI not set. Set this environment variable first:" -ForegroundColor Yellow
    Write-Host "   - Local: mongodb://localhost:27017" -ForegroundColor White
    Write-Host "   - Atlas: mongodb+srv://user:pass@cluster.mongodb.net/" -ForegroundColor White
    Write-Host "`nExample (Windows): `$env:MONGODB_URI = 'mongodb://localhost:27017'" -ForegroundColor Gray
    Read-Host "Press Enter after setting MONGODB_URI, or Ctrl+C to exit"
}

# Step 3: Test MongoDB connection
Write-Host "🧪 Testing MongoDB connection..." -ForegroundColor Cyan
$env:MONGODB_URI = $mongoUri
node test-mongodb.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ MongoDB connection failed. Fix the connection and try again." -ForegroundColor Red
    exit 1
}

# Step 4: Deploy to Vercel
Write-Host "📤 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "   Run: vercel --prod" -ForegroundColor Gray
Write-Host "   Then set environment variable MONGODB_URI in Vercel dashboard" -ForegroundColor Gray
Read-Host "Press Enter to continue with Vercel deployment"

vercel --prod

# Step 5: Setup GitHub Pages branch
Write-Host "📄 Setting up GitHub Pages deployment..." -ForegroundColor Cyan

$ghPagesDir = "docs"
if (-not (Test-Path $ghPagesDir)) {
    New-Item -ItemType Directory -Path $ghPagesDir -Force | Out-Null
}

# Copy frontend files
Copy-Item -Path "index.html", "debug.html", "test.html" -Destination $ghPagesDir -Force
Copy-Item -Path "css", "js", "images" -Destination $ghPagesDir -Recurse -Force -ErrorAction SilentlyContinue

# Create .nojekyll for GitHub Pages
"" | Out-File -FilePath "$ghPagesDir/.nojekyll" -Encoding utf8

# Git operations
git config user.name "Deployment Script" 2>/dev/null
git config user.email "noreply@ledger.app" 2>/dev/null

git add $ghPagesDir
git add "api/*" -ErrorAction SilentlyContinue
git commit -m "Deploy to GitHub Pages and Vercel" -q 2>/dev/null

git push origin main
Write-Host "✅ GitHub Pages files staged and pushed" -ForegroundColor Green

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "📍 Vercel: Check dashboard for deployment URL" -ForegroundColor Cyan
Write-Host "📍 GitHub Pages: Enable in repo Settings > Pages > Deploy from branch (docs folder)" -ForegroundColor Cyan
