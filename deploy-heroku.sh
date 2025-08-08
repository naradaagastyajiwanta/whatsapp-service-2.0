#!/bin/bash

# WhatsApp Service - Heroku Deployment Script
echo "🚀 Deploying WhatsApp Service to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first."
    exit 1
fi

# Login to Heroku (if not already logged in)
echo "🔑 Checking Heroku authentication..."
heroku auth:whoami

# Create Heroku app if it doesn't exist
read -p "Enter your Heroku app name: " APP_NAME
if heroku apps:info $APP_NAME &> /dev/null; then
    echo "✅ App '$APP_NAME' already exists"
else
    echo "🆕 Creating new Heroku app: $APP_NAME"
    heroku create $APP_NAME
fi

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production -a $APP_NAME
heroku config:set WA_SESSION_TIMEOUT=300000 -a $APP_NAME
heroku config:set WA_HEARTBEAT_INTERVAL=25000 -a $APP_NAME
heroku config:set WA_RECONNECT_DELAY=3000 -a $APP_NAME

# Add buildpacks if needed
echo "🔧 Setting up buildpacks..."
heroku buildpacks:set heroku/nodejs -a $APP_NAME

# Deploy to Heroku
echo "📦 Deploying to Heroku..."
git add .
git commit -m "Deploy WhatsApp Service with persistent session"
git push heroku main

# Scale dyno
echo "⚡ Scaling dyno..."
heroku ps:scale web=1 -a $APP_NAME

# Show logs
echo "📋 Showing logs..."
heroku logs --tail -a $APP_NAME

echo "✅ Deployment completed!"
echo "🌐 Your app URL: https://$APP_NAME.herokuapp.com"
