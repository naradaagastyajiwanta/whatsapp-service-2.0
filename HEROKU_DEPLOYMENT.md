# 🚀 WhatsApp Service - Heroku Deployment Guide

## 📋 Perubahan untuk Persistent Session

Aplikasi telah diupdate dengan perubahan berikut untuk mendukung persistent session di Heroku:

### ✅ Yang Sudah Diperbaiki:

1. **Database Auth State** - Session disimpan di SQLite database instead of filesystem
2. **Auto-Migration** - Filesystem auth otomatis di-migrate ke database
3. **Improved Connection Handling** - Better handling untuk berbagai disconnect scenarios
4. **Enhanced Heartbeat** - Lebih frequent heartbeat (25s) dengan auto-reconnect
5. **Session Validation** - Validasi session pada startup
6. **Better Logging** - Detailed logging untuk troubleshooting

### 🔧 Cara Deploy ke Heroku:

#### Option 1: Manual Deployment
```bash
# 1. Login ke Heroku
heroku login

# 2. Create app (ganti 'your-app-name' dengan nama app Anda)
heroku create your-app-name

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set WA_SESSION_TIMEOUT=300000
heroku config:set WA_HEARTBEAT_INTERVAL=25000

# 4. Deploy
git add .
git commit -m "Deploy WhatsApp Service with persistent session"
git push heroku main

# 5. Scale dyno
heroku ps:scale web=1

# 6. Monitor logs
heroku logs --tail
```

#### Option 2: Automated Script
```bash
# Linux/Mac
chmod +x deploy-heroku.sh
./deploy-heroku.sh

# Windows
deploy-heroku.bat
```

### 📱 Cara Penggunaan Setelah Deploy:

1. **First Time Setup:**
   - Deploy app ke Heroku
   - Buka app URL di browser
   - Scan QR code dengan WhatsApp mobile
   - Session tersimpan otomatis di database

2. **Setelah App Restart/Redeploy:**
   - App akan otomatis load session dari database
   - Tidak perlu scan QR code lagi
   - Koneksi WhatsApp tetap connected

### 🔍 Monitoring & Troubleshooting:

#### Check Logs:
```bash
heroku logs --tail -a your-app-name
```

#### Check Session Status:
- Buka dashboard app di browser
- Lihat connection status
- Monitor heartbeat dan session info

#### Force Restart Jika Diperlukan:
```bash
heroku restart -a your-app-name
```

### 🚨 Expected Behavior:

#### ✅ Normal Flow:
1. **Startup**: `🚀 Starting WhatsApp Service...`
2. **Database**: `📊 Initializing database...`
3. **Session Check**: `📱 Found existing session in database, attempting to connect...`
4. **Connection**: `✅ WhatsApp connection established successfully!`
5. **Heartbeat**: `💓 Starting heartbeat mechanism...`

#### ⚠️ First Time (No Session):
1. **Startup**: `🚀 Starting WhatsApp Service...`
2. **Database**: `📊 Initializing database...`
3. **New Session**: `🆕 No existing session found, will need QR scan...`
4. **QR Code**: `📱 QR Code received, please scan with your WhatsApp mobile app:`
5. **After Scan**: `✅ WhatsApp connection established successfully!`

### 🛡️ Session Persistence Features:

1. **Auto-Save**: Session tersimpan otomatis ke database setiap update
2. **Auto-Load**: Session di-load otomatis pada startup
3. **Migration**: Filesystem auth otomatis di-migrate ke database
4. **Validation**: Session di-validasi sebelum connect
5. **Recovery**: Auto-recovery dari connection issues

### 📊 Database Schema:

```sql
-- Auth session storage
CREATE TABLE auth_session (
    id INTEGER PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    data BLOB NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 🔧 Environment Variables:

```bash
NODE_ENV=production
PORT=3000
WA_SESSION_TIMEOUT=300000
WA_HEARTBEAT_INTERVAL=25000
WA_RECONNECT_DELAY=3000
```

### 📈 Performance Optimizations:

1. **Heartbeat**: 25 detik interval untuk keep-alive
2. **Progressive Reconnect**: Delay bertambah jika disconnect berulang
3. **Session Caching**: Session di-cache di memory
4. **Auto-Recovery**: Otomatis reconnect jika connection lost

---

## 🎯 Hasil Akhir:

Setelah deploy ke Heroku:
- ✅ **Session persistent** across app restarts
- ✅ **No more QR scanning** setelah initial setup
- ✅ **Auto-reconnect** jika connection lost
- ✅ **Better reliability** untuk production use
- ✅ **Zero downtime** untuk WhatsApp session

---

## 📞 Support:

Jika ada masalah:
1. Check logs dengan `heroku logs --tail`
2. Monitor connection status di dashboard
3. Force restart jika diperlukan
4. Clear session dan scan QR baru jika session corrupt

**Happy Deploying! 🚀**
