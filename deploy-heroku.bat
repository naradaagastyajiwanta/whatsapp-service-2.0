@echo off
REM WhatsApp Service - Heroku Deployment Script for Windows

echo 🚀 Deploying WhatsApp Service to Heroku...

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Heroku CLI is not installed. Please install it first.
    pause
    exit /b 1
)

REM Login to Heroku
echo 🔑 Checking Heroku authentication...
heroku auth:whoami

REM Get app name from user
set /p APP_NAME="Enter your Heroku app name: "

REM Create Heroku app if it doesn't exist
heroku apps:info %APP_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo 🆕 Creating new Heroku app: %APP_NAME%
    heroku create %APP_NAME%
) else (
    echo ✅ App '%APP_NAME%' already exists
)

REM Set environment variables
echo ⚙️ Setting environment variables...
heroku config:set NODE_ENV=production -a %APP_NAME%
heroku config:set WA_SESSION_TIMEOUT=300000 -a %APP_NAME%
heroku config:set WA_HEARTBEAT_INTERVAL=25000 -a %APP_NAME%
heroku config:set WA_RECONNECT_DELAY=3000 -a %APP_NAME%

REM Add buildpacks
echo 🔧 Setting up buildpacks...
heroku buildpacks:set heroku/nodejs -a %APP_NAME%

REM Deploy to Heroku
echo 📦 Deploying to Heroku...
git add .
git commit -m "Deploy WhatsApp Service with persistent session"
git push heroku main

REM Scale dyno
echo ⚡ Scaling dyno...
heroku ps:scale web=1 -a %APP_NAME%

echo ✅ Deployment completed!
echo 🌐 Your app URL: https://%APP_NAME%.herokuapp.com

REM Show logs
echo 📋 Showing logs...
heroku logs --tail -a %APP_NAME%

pause
