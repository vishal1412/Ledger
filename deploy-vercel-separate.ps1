# Business Ledger - Vercel Deployment Script for Separate Project
# This script deploys to a separate Vercel project + MongoDB Atlas account
# Configured for: https://vercel.com/vishalsethi14-2174s-projects/ledger-qa

Write-Host "Business Ledger - Separate Vercel Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Project: https://vercel.com/vishalsethi14-2174s-projects/ledger-qa" -ForegroundColor Gray
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
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERCEL PROJECT LINK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if this project is already linked to Vercel
Write-Host "Checking Vercel project link..." -ForegroundColor Yellow

$vercelProjectPath = ".\.vercel\project.json"
$isLinked = Test-Path $vercelProjectPath

if ($isLinked) {
    Write-Host "Found existing Vercel project link." -ForegroundColor Green
    $projectJson = Get-Content $vercelProjectPath | ConvertFrom-Json
    Write-Host "Current project ID: $($projectJson.projectId)" -ForegroundColor Gray
} else {
    Write-Host "No existing Vercel project link found." -ForegroundColor Yellow
}

# Prompt to link/relink to ledger-qa
Write-Host ""
Write-Host "This will link to: ledger-qa (vishalsethi14-2174s-projects)" -ForegroundColor Cyan
$response = Read-Host "Link to ledger-qa project? (Y/N)"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Linking to ledger-qa project..." -ForegroundColor Yellow
    
    # Remove existing link if present
    if (Test-Path ".\.vercel") {
        Remove-Item ".\.vercel" -Recurse -Force
    }
    
    # Use vercel link to connect to the specific project
    # This will prompt you to confirm the project
    vercel link
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Successfully linked to ledger-qa project!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Failed to link project" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Skipping project link" -ForegroundColor Yellow
}

# Environment setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MONGODB_URI should be configured in:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/vishalsethi14-2174s-projects/ledger-qa/settings/environment-variables" -ForegroundColor White
Write-Host ""

# Check for .env file just for local reference
$envPath = ".\.env"
if (Test-Path $envPath) {
    Write-Host ".env file exists locally" -ForegroundColor Green
} else {
    Write-Host "No local .env file (optional for remote deployment)" -ForegroundColor Gray
}

Write-Host ""

# Prompt user
Write-Host "Ready to deploy to ledger-qa?" -ForegroundColor Cyan
Write-Host ""
Write-Host "The next step will:" -ForegroundColor Gray
Write-Host "   1. Install npm dependencies" -ForegroundColor Gray
Write-Host "   2. Deploy to ledger-qa project" -ForegroundColor Gray
Write-Host "   3. Show you the deployment URL" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Proceed? (Y/N)"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Starting deployment to ledger-qa..." -ForegroundColor Yellow
    Write-Host ""
    
    # Deploy to Vercel (production)
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Go to project: https://vercel.com/vishalsethi14-2174s-projects/ledger-qa" -ForegroundColor White
        Write-Host "   2. Environment variables should be pre-configured" -ForegroundColor White
        Write-Host "   3. Test your deployment: vercel env pull && npm run test" -ForegroundColor White
        Write-Host ""
        Write-Host "Documentation:" -ForegroundColor Cyan
        Write-Host "   • Project link: https://vercel.com/vishalsethi14-2174s-projects/ledger-qa" -ForegroundColor White
        Write-Host "   • View logs: vercel logs" -ForegroundColor Gray
        Write-Host "   • Rollback: vercel rollback" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Deployment encountered an issue" -ForegroundColor Yellow
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
        Write-Host "   Run 'vercel logs' for more details" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    Write-Host "   Ensure MONGODB_URI is set in ledger-qa environment variables" -ForegroundColor White
    Write-Host "   Then run: .\deploy-vercel-separate.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "   • Project: ledger-qa (https://vercel.com/vishalsethi14-2174s-projects/ledger-qa)" -ForegroundColor White
Write-Host "   • Branch: separate-vercel-db (git checkout separate-vercel-db)" -ForegroundColor White
Write-Host "   • Setup guide: MONGODB_SETUP.md" -ForegroundColor White
Write-Host ""
