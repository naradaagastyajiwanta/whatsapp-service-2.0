@echo off
echo ============================================
echo    HEROKU STABILITY DEPLOYMENT SCRIPT     
echo ============================================
echo.

echo [1/8] 🔧 Setting Heroku environment variables...
heroku config:set NODE_ENV=production --app whatsappservice-aksitara
heroku config:set NODE_OPTIONS="--max-old-space-size=512" --app whatsappservice-aksitara
heroku config:set WEB_CONCURRENCY=1 --app whatsappservice-aksitara
heroku config:set UV_THREADPOOL_SIZE=4 --app whatsappservice-aksitara
heroku config:set SESSION_CLEANUP_INTERVAL=3600000 --app whatsappservice-aksitara
heroku config:set HEARTBEAT_INTERVAL=25000 --app whatsappservice-aksitara
heroku config:set CONNECTION_RETRY_DELAY=5000 --app whatsappservice-aksitara
heroku config:set MAX_RECONNECT_ATTEMPTS=10 --app whatsappservice-aksitara
heroku config:set MAX_MEMORY_MB=450 --app whatsappservice-aksitara

echo.
echo [2/8] 🎯 Setting dyno formation...
heroku ps:scale web=1 --app whatsappservice-aksitara

echo.
echo [3/8] 📦 Committing stability improvements...
git add .
git commit -m "feat: Add Heroku stability manager and optimizations

- Add HerokuStabilityManager for memory and connection monitoring
- Optimize database with WAL mode and maintenance routines
- Improve WhatsApp connection handling for Heroku environment
- Add graceful shutdown handling for dyno restarts
- Implement session cleanup and garbage collection
- Add force session save for restart scenarios"

echo.
echo [4/8] 🚀 Deploying to Heroku...
git push heroku main

echo.
echo [5/8] ⏳ Waiting for deployment to complete...
timeout /t 30 /nobreak

echo.
echo [6/8] 🔄 Restarting application...
heroku restart --app whatsappservice-aksitara

echo.
echo [7/8] ⏳ Waiting for restart...
timeout /t 15 /nobreak

echo.
echo [8/8] 📊 Checking deployment status...
heroku ps --app whatsappservice-aksitara
echo.
heroku logs --tail --app whatsappservice-aksitara --num 20

echo.
echo ============================================
echo    DEPLOYMENT COMPLETED!                   
echo ============================================
echo.
echo 🎯 Stability improvements deployed:
echo    ✅ Memory monitoring and cleanup
echo    ✅ Database optimization with WAL mode
echo    ✅ Heroku-specific connection handling
echo    ✅ Graceful shutdown for dyno restarts
echo    ✅ Session persistence improvements
echo.
echo 📝 Monitor the logs for stability improvements
echo 🌐 Service URL: https://whatsappservice-aksitara-592264a6db71.herokuapp.com
echo.
pause
