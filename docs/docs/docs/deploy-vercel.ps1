# Business Ledger - Vercel Deployment Script
# This script automates the deployment process to Vercel

Write-Host "Business Ledger - Vercel Deployment" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
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

# Check if .env.example exists
if (Test-Path ".env.example") {
    Write-Host "Environment setup reminder:" -ForegroundColor Yellow
    Write-Host "   1. Create MongoDB Atlas account: https://cloud.mongodb.com" -ForegroundColor White
    Write-Host "   2. Get your connection string" -ForegroundColor White
    Write-Host "   3. Add MONGODB_URI to Vercel environment variables" -ForegroundColor White
    Write-Host ""
}

# Prompt user
Write-Host "Ready to deploy!" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "Deploy to Vercel now? (Y/N)"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
    Write-Host ""
    
    # Deploy to Vercel
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "   2. Add MONGODB_URI environment variable" -ForegroundColor White
        Write-Host "   3. Redeploy with: vercel --prod" -ForegroundColor White
        Write-Host "   4. Test: https://your-url.vercel.app/api/health" -ForegroundColor White
        Write-Host ""
        Write-Host "See QUICK_DEPLOY.md for detailed instructions" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Deployment failed" -ForegroundColor Red
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
        Write-Host "   Run 'vercel logs' for more details" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    Write-Host "   Run this script again when ready" -ForegroundColor White
    Write-Host "   Or deploy manually with: vercel --prod" -ForegroundColor White
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "   - Quick Start: QUICK_DEPLOY.md" -ForegroundColor White
Write-Host "   - MongoDB Setup: MONGODB_SETUP.md" -ForegroundColor White
Write-Host "   - Vercel Guide: VERCEL_DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
