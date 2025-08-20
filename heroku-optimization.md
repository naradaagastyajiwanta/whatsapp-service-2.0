# HEROKU OPTIMIZATION PLAN

## 1. DYNO CONFIGURATION
- **Upgrade to Standard Dyno**: $7/month untuk 1GB RAM + no sleep
- **Enable Dyno Metadata**: For better process monitoring
- **Configure Buildpacks**: Optimize Node.js version

## 2. ENVIRONMENT VARIABLES
```env
# Heroku Specific Optimizations
NODE_ENV=production
PORT=3000
WEB_CONCURRENCY=1
NODE_OPTIONS=--max-old-space-size=512
UV_THREADPOOL_SIZE=4

# WhatsApp Stability
SESSION_CLEANUP_INTERVAL=3600000
HEARTBEAT_INTERVAL=25000
CONNECTION_RETRY_DELAY=5000
MAX_RECONNECT_ATTEMPTS=10

# Database Optimization
DB_WAL_MODE=true
DB_CHECKPOINT_INTERVAL=300000
DB_VACUUM_INTERVAL=86400000
```

## 3. DYNO FORMATION
```bash
# Single web dyno untuk mencegah session conflict
heroku ps:scale web=1
# Background worker untuk maintenance tasks
heroku ps:scale worker=1
```
