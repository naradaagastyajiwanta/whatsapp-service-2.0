const DatabaseManager = require('./db');
const WhatsAppManager = require('./whatsapp');
const APIServer = require('./api');
const { logWithTimestamp } = require('./utils');

class WhatsAppService {
    constructor() {
        this.dbManager = null;
        this.whatsappManager = null;
        this.apiServer = null;
        this.isShuttingDown = false;
    }

    async start() {
        try {
            logWithTimestamp('🚀 Starting WhatsApp Service...');

            // Initialize database
            logWithTimestamp('📊 Initializing database...');
            this.dbManager = new DatabaseManager();

            // Initialize WhatsApp
            logWithTimestamp('📱 Initializing WhatsApp connection...');
            this.whatsappManager = new WhatsAppManager(this.dbManager);
            await this.whatsappManager.initialize();

            // Initialize API server
            logWithTimestamp('🌐 Starting API server...');
            this.apiServer = new APIServer(this.whatsappManager, this.dbManager, process.env.PORT || 3000);
            this.apiServer.start();

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            logWithTimestamp('✅ WhatsApp Service started successfully!');
            logWithTimestamp('');
            logWithTimestamp('📋 Service Information:');
            logWithTimestamp('   • Frontend: http://localhost:3000');
            logWithTimestamp('   • API Docs: Available at the endpoints below');
            logWithTimestamp('   • Health Check: GET /health');
            logWithTimestamp('   • Send Message: POST /send');
            logWithTimestamp('   • Get Messages: GET /messages');
            logWithTimestamp('   • WhatsApp Status: GET /status');
            logWithTimestamp('   • Auto Reply: POST /auto-reply');
            logWithTimestamp('');
            logWithTimestamp('💡 Tips:');
            logWithTimestamp('   • Scan QR code with your WhatsApp mobile app');
            logWithTimestamp('   • Auto-reply is enabled by default');
            logWithTimestamp('   • All messages are saved to SQLite database');
            logWithTimestamp('');

        } catch (error) {
            logWithTimestamp(`❌ Failed to start WhatsApp Service: ${error.message}`, 'error');
            console.error(error);
            process.exit(1);
        }
    }

    setupGracefulShutdown() {
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

        signals.forEach(signal => {
            process.on(signal, async () => {
                if (this.isShuttingDown) return;
                this.isShuttingDown = true;

                logWithTimestamp(`🛑 Received ${signal}, shutting down gracefully...`);
                await this.shutdown();
                process.exit(0);
            });
        });

        process.on('uncaughtException', (error) => {
            logWithTimestamp(`💥 Uncaught Exception: ${error.message}`, 'error');
            console.error(error.stack);
            this.shutdown().then(() => process.exit(1));
        });

        process.on('unhandledRejection', (reason, promise) => {
            logWithTimestamp(`💥 Unhandled Rejection at ${promise}: ${reason}`, 'error');
            console.error(reason);
        });
    }

    async shutdown() {
        try {
            logWithTimestamp('🔄 Shutting down services...');

            // Stop API server
            if (this.apiServer) {
                this.apiServer.stop();
            }

            // Disconnect WhatsApp
            if (this.whatsappManager) {
                await this.whatsappManager.disconnect();
            }

            // Close database
            if (this.dbManager) {
                this.dbManager.close();
            }

            logWithTimestamp('✅ WhatsApp Service shut down successfully');
        } catch (error) {
            logWithTimestamp(`❌ Error during shutdown: ${error.message}`, 'error');
        }
    }
}

// Start the service
if (require.main === module) {
    const service = new WhatsAppService();
    service.start().catch(error => {
        console.error('Failed to start service:', error);
        process.exit(1);
    });
}

module.exports = WhatsAppService;
