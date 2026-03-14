# Business Ledger - Vercel Deployment Script for Separate Project
# This script deploys to a separate Vercel project + MongoDB Atlas account
# Use this when you want an isolated deployment (e.g., staging, testing, or personal account)

Write-Host "Business Ledger - Separate Vercel Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "This script will help you deploy to a separate Vercel project" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "Vercel CLI installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Vercel CLI installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SEPARATE VERCEL PROJECT SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if this project is already linked to Vercel
Write-Host "Checking Vercel project link..." -ForegroundColor Yellow

# Look for .vercel/project.json to see if there's an existing link
$vercelProjectPath = ".\.vercel\project.json"
$isLinked = Test-Path $vercelProjectPath

if ($isLinked) {
    Write-Host "Found existing Vercel project link." -ForegroundColor Yellow
    $response = Read-Host "Do you want to link a DIFFERENT Vercel project? (Y/N)"
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host ""
        Write-Host "Unlinking current project..." -ForegroundColor Yellow
        Remove-Item ".\.vercel" -Recurse -Force
        Write-Host "Current project link removed." -ForegroundColor Green
    } else {
        Write-Host "Using existing project link." -ForegroundColor Gray
    }
} else {
    Write-Host "No existing Vercel project link found. Creating a new one..." -ForegroundColor Gray
}

Write-Host ""

# Environment setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ENVIRONMENT VARIABLES SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Before deploying, you need:" -ForegroundColor Yellow
Write-Host "   1. A separate Vercel account (or team project)" -ForegroundColor White
Write-Host "   2. A separate MongoDB Atlas account/cluster" -ForegroundColor White
Write-Host "   3. Your new MongoDB connection string (MONGODB_URI)" -ForegroundColor White
Write-Host ""

# Check for .env file
$envPath = ".\.env"
if (Test-Path $envPath) {
    Write-Host ".env file found!" -ForegroundColor Green
    $envContent = Get-Content $envPath
    if ($envContent -match "MONGODB_URI") {
        Write-Host "   ✓ MONGODB_URI is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ MONGODB_URI is NOT set in .env" -ForegroundColor Yellow
        Write-Host "   Add it before deploying!" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\.env"
        Write-Host "Created .env from .env.example" -ForegroundColor Green
        Write-Host "Edit .env and add your MongoDB URI:" -ForegroundColor Yellow
        Write-Host "   code .env" -ForegroundColor Gray
    }
}

Write-Host ""

# Prompt user
Write-Host "Ready to deploy to separate Vercel project?" -ForegroundColor Cyan
Write-Host ""
Write-Host "The next step will:" -ForegroundColor Gray
Write-Host "   1. Link/create a new Vercel project" -ForegroundColor Gray
Write-Host "   2. Deploy your code" -ForegroundColor Gray
Write-Host "   3. Guide you through setting environment variables" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Proceed? (Y/N)"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Starting Vercel deployment..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "When prompted:" -ForegroundColor Cyan
    Write-Host "   • Set up and deploy? → Y" -ForegroundColor Gray
    Write-Host "   • Which scope? → Your account/team" -ForegroundColor Gray
    Write-Host "   • Link to existing project? → Y/N (your choice)" -ForegroundColor Gray
    Write-Host "   • What's your project name? → Choose a unique name (e.g., ledger-staging)" -ForegroundColor Gray
    Write-Host ""
    
    # Deploy to Vercel (without --prod, so it creates a preview/staging first)
    vercel
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Project link successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "   2. Select your NEW project" -ForegroundColor White
        Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor White
        Write-Host "   4. Add MONGODB_URI with your SEPARATE Atlas connection string" -ForegroundColor White
        Write-Host "   5. Redeploy with: vercel --prod" -ForegroundColor White
        Write-Host "   6. Test: https://your-project-name.vercel.app/api/health" -ForegroundColor White
        Write-Host ""
        Write-Host "Or use this script again when ready:" -ForegroundColor Gray
        Write-Host "   .\deploy-vercel-separate.ps1" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Deployment encountered an issue" -ForegroundColor Yellow
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
        Write-Host "   Run 'vercel logs' for more details" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    Write-Host "   1. Set up your MongoDB Atlas account: https://cloud.mongodb.com" -ForegroundColor White
    Write-Host "   2. Get your connection string" -ForegroundColor White
    Write-Host "   3. Add it to .env file" -ForegroundColor White
    Write-Host "   4. Run this script when ready: .\deploy-vercel-separate.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "   • Branch: separate-vercel-db (git checkout separate-vercel-db)" -ForegroundColor White
Write-Host "   • Setup guide: MONGODB_SETUP.md" -ForegroundColor White
Write-Host "   • Quick start: QUICK_DEPLOY.md" -ForegroundColor White
Write-Host ""
