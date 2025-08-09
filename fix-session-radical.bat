@echo off
echo ============================================
echo    WHATSAPP SERVICE RADICAL SESSION FIX   
echo ============================================
echo.

echo [1/6] ⚡ Stopping all instances...
heroku ps:scale web=0 --app whatsappservice-aksitara

echo.
echo [2/6] ⏳ Waiting for complete shutdown...
timeout /t 15 /nobreak

echo.
echo [3/6] 🧹 Clearing session data (via Heroku config)...
heroku config:set SESSION_RESET=true --app whatsappservice-aksitara

echo.
echo [4/6] ⏳ Additional cooldown period...
timeout /t 20 /nobreak

echo.
echo [5/6] 🚀 Restarting with single instance...
heroku ps:scale web=1 --app whatsappservice-aksitara

echo.
echo [6/6] 📊 Monitoring startup...
timeout /t 10 /nobreak
heroku logs --tail --app whatsappservice-aksitara

echo.
echo ============================================
echo    RADICAL SESSION FIX COMPLETED!        
echo ============================================
pause
