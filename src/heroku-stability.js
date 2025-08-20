const { logWithTimestamp } = require('./utils');

class HerokuStabilityManager {
    constructor(whatsappManager, dbManager) {
        this.whatsappManager = whatsappManager;
        this.dbManager = dbManager;
        this.isHeroku = !!process.env.DYNO;
        this.stabilityConfig = {
            maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB) || 450, // 90% of 512MB
            checkInterval: 30000, // 30 seconds
            forceRestartOnHighMemory: true,
            sessionCleanupInterval: 3600000, // 1 hour
            heartbeatFailureThreshold: 3,
            consecutiveFailures: 0
        };
        
        this.monitoringInterval = null;
        this.cleanupInterval = null;
        this.lastHealthCheck = Date.now();
    }

    start() {
        if (!this.isHeroku) {
            logWithTimestamp('🏠 Running locally - stability manager disabled');
            return;
        }

        logWithTimestamp('🛡️ Starting Heroku stability manager...');
        
        // Memory and health monitoring
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.stabilityConfig.checkInterval);

        // Session cleanup
        this.cleanupInterval = setInterval(() => {
            this.performSessionCleanup();
        }, this.stabilityConfig.sessionCleanupInterval);

        // Dyno restart handler
        this.setupDynoRestartHandling();

        logWithTimestamp('✅ Heroku stability manager started');
    }

    stop() {
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        logWithTimestamp('🛡️ Heroku stability manager stopped');
    }

    async performHealthCheck() {
        try {
            const memUsage = process.memoryUsage();
            const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            // Log memory usage
            if (memUsageMB > this.stabilityConfig.maxMemoryMB * 0.8) {
                logWithTimestamp(`⚠️ High memory usage: ${memUsageMB}MB`, 'warn');
            }

            // Force restart if memory too high
            if (memUsageMB > this.stabilityConfig.maxMemoryMB) {
                logWithTimestamp(`🚨 Memory limit exceeded: ${memUsageMB}MB - forcing restart`, 'error');
                if (this.stabilityConfig.forceRestartOnHighMemory) {
                    await this.forceGracefulRestart();
                }
                return;
            }

            // Check WhatsApp connection health
            if (!this.whatsappManager.isConnected) {
                this.consecutiveFailures++;
                logWithTimestamp(`❌ WhatsApp not connected (failure ${this.consecutiveFailures}/${this.stabilityConfig.heartbeatFailureThreshold})`);
                
                if (this.consecutiveFailures >= this.stabilityConfig.heartbeatFailureThreshold) {
                    logWithTimestamp('🔄 Too many consecutive failures - forcing reconnection');
                    await this.forceReconnection();
                    this.consecutiveFailures = 0;
                }
            } else {
                this.consecutiveFailures = 0;
            }

            this.lastHealthCheck = Date.now();
        } catch (error) {
            logWithTimestamp(`❌ Health check error: ${error.message}`, 'error');
        }
    }

    async performSessionCleanup() {
        try {
            logWithTimestamp('🧹 Performing session cleanup...');
            
            // Clean old auth sessions
            const cleanedSessions = this.dbManager.cleanupOldSessions(24); // 24 hours
            if (cleanedSessions > 0) {
                logWithTimestamp(`🗑️ Cleaned ${cleanedSessions} old auth sessions`);
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                logWithTimestamp('♻️ Forced garbage collection');
            }

            // Log current stats
            const memUsage = process.memoryUsage();
            logWithTimestamp(`📊 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memUsage.rss / 1024 / 1024)}MB RSS`);
            
        } catch (error) {
            logWithTimestamp(`❌ Session cleanup error: ${error.message}`, 'error');
        }
    }

    setupDynoRestartHandling() {
        // Handle SIGTERM (Heroku shutdown signal)
        process.on('SIGTERM', () => {
            logWithTimestamp('🔄 SIGTERM received - Heroku dyno restart detected');
            this.handleGracefulShutdown();
        });

        // Handle SIGINT
        process.on('SIGINT', () => {
            logWithTimestamp('🛑 SIGINT received - manual shutdown');
            this.handleGracefulShutdown();
        });
    }

    async handleGracefulShutdown() {
        try {
            logWithTimestamp('🔄 Performing graceful shutdown...');
            
            // Stop stability manager
            this.stop();
            
            // Save current session state
            if (this.whatsappManager.isConnected) {
                logWithTimestamp('💾 Saving WhatsApp session before shutdown...');
                // Force save current state
                await this.whatsappManager.forceSaveSession();
            }
            
            // Clean disconnect
            await this.whatsappManager.disconnect();
            
            logWithTimestamp('✅ Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logWithTimestamp(`❌ Error during graceful shutdown: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    async forceReconnection() {
        try {
            logWithTimestamp('🔄 Forcing WhatsApp reconnection...');
            await this.whatsappManager.reconnectManual();
        } catch (error) {
            logWithTimestamp(`❌ Force reconnection failed: ${error.message}`, 'error');
        }
    }

    async forceGracefulRestart() {
        try {
            logWithTimestamp('🔄 Forcing graceful restart due to high memory usage...');
            await this.handleGracefulShutdown();
        } catch (error) {
            logWithTimestamp(`❌ Force restart failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    getStats() {
        const memUsage = process.memoryUsage();
        return {
            isHeroku: this.isHeroku,
            memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            rssMemoryMB: Math.round(memUsage.rss / 1024 / 1024),
            maxMemoryMB: this.stabilityConfig.maxMemoryMB,
            consecutiveFailures: this.consecutiveFailures,
            lastHealthCheck: this.lastHealthCheck,
            uptime: Math.round(process.uptime())
        };
    }
}

module.exports = HerokuStabilityManager;
