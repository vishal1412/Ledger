@echo off
REM Start script for Business Ledger

echo.
echo ===================================
echo Business Ledger - Local Development
echo ===================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
node test-mongodb.js
if errorlevel 1 (
    echo.
    echo ERROR: MongoDB is not running!
    echo.
    echo Options:
    echo 1. Install MongoDB: https://www.mongodb.com/try/download/community
    echo 2. Start MongoDB: mongod
    echo 3. Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas
    echo.
    echo Then set the MONGODB_URI environment variable:
    echo   set MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/business_ledger
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ MongoDB connection verified
echo.
echo Starting Business Ledger server...
echo Opening application at http://localhost:3000
echo.

REM Start server
npm start
