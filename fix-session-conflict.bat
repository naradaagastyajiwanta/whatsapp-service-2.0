@echo off
echo 🔧 Fixing WhatsApp Session Conflict (Error 440)

echo 1️⃣ Checking local processes on port 3000...
netstat -ano | findstr :3000
if %errorlevel% equ 0 (
    echo ⚠️ Found local service on port 3000. Please stop it manually.
    pause
)

echo 2️⃣ Restarting Heroku app...
heroku restart -a whatsappservice-aksitara

echo 3️⃣ Waiting 10 seconds...
timeout /t 10 /nobreak

echo 4️⃣ Scaling dyno to clear session...
heroku ps:scale web=0 -a whatsappservice-aksitara
timeout /t 5 /nobreak
heroku ps:scale web=1 -a whatsappservice-aksitara

echo 5️⃣ Checking logs...
heroku logs --tail -a whatsappservice-aksitara

pause
