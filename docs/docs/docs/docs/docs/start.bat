@echo off
echo Starting Business Ledger Server...
echo ----------------------------------
echo Data will be saved to %~dp0data
echo Images will be saved to %~dp0images
echo.
echo Access the app at: http://localhost:3000
echo.
node server.js
pause
