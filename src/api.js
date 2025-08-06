const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const { isValidPhoneNumber, logWithTimestamp } = require('./utils');

class APIServer {
    constructor(whatsappManager, dbManager, port = 3000) {
        this.app = express();
        this.whatsappManager = whatsappManager;
        this.dbManager = dbManager;
        this.port = port;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors());
        
        // JSON parser
        this.app.use(express.json());
        
        // Static files untuk frontend
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            logWithTimestamp(`🌐 ${req.method} ${req.path} from ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'WhatsApp Service API'
            });
        });

        // Get WhatsApp connection status with stability info
        this.app.get('/status', (req, res) => {
            try {
                const waStatus = this.whatsappManager.getConnectionStatus();
                const dbStatus = this.dbManager.getConnectionStatus();
                
                // Add connection stability information
                const stabilityInfo = this.whatsappManager.getConnectionStability();
                
                res.json({
                    success: true,
                    whatsapp: {
                        ...waStatus,
                        stability: stabilityInfo
                    },
                    database: dbStatus,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Send message
        this.app.post('/send', async (req, res) => {
            try {
                const { phoneNumber, message } = req.body;

                // Validasi input
                if (!phoneNumber || !message) {
                    return res.status(400).json({
                        success: false,
                        error: 'Phone number and message are required'
                    });
                }

                if (!isValidPhoneNumber(phoneNumber)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid phone number format'
                    });
                }

                if (message.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Message cannot be empty'
                    });
                }

                // Kirim pesan
                const result = await this.whatsappManager.sendMessage(phoneNumber, message.trim());
                
                res.json({
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /send: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get all messages
        this.app.get('/messages', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 100;
                const phoneNumber = req.query.phone;

                let messages;
                if (phoneNumber) {
                    messages = this.dbManager.getMessagesByNumber(phoneNumber, limit);
                } else {
                    messages = this.dbManager.getAllMessages(limit);
                }

                res.json({
                    success: true,
                    data: messages,
                    count: messages.length,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /messages: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get QR Code
        this.app.get('/qr', (req, res) => {
            try {
                const status = this.whatsappManager.getConnectionStatus();
                
                if (status.qrCode) {
                    res.json({
                        success: true,
                        qrCode: status.qrCode,
                        message: 'QR Code available for scanning'
                    });
                } else {
                    res.json({
                        success: false,
                        message: 'No QR Code available. WhatsApp might be connected or connection is in progress.'
                    });
                }
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get QR Code as image
        this.app.get('/qr/image', async (req, res) => {
            try {
                const status = this.whatsappManager.getConnectionStatus();
                
                if (status.qrCode) {
                    // Generate QR code as PNG image
                    const qrCodeImage = await QRCode.toBuffer(status.qrCode, {
                        type: 'png',
                        width: 256,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    
                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Content-Length', qrCodeImage.length);
                    res.end(qrCodeImage);
                } else {
                    res.status(404).json({
                        success: false,
                        message: 'No QR Code available'
                    });
                }
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Disconnect WhatsApp
        this.app.post('/disconnect', async (req, res) => {
            try {
                await this.whatsappManager.disconnect();
                
                res.json({
                    success: true,
                    message: 'WhatsApp disconnected successfully',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /disconnect: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Reconnect WhatsApp
        this.app.post('/reconnect', async (req, res) => {
            try {
                // Gunakan reconnectManual untuk reset flag manual disconnect
                await this.whatsappManager.reconnectManual();
                
                res.json({
                    success: true,
                    message: 'WhatsApp manual reconnection initiated',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /reconnect: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Logout WhatsApp (remove session)
        this.app.post('/logout', async (req, res) => {
            try {
                await this.whatsappManager.logout();
                
                res.json({
                    success: true,
                    message: 'WhatsApp logged out successfully. Session removed.',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /logout: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Force stabilize connection (clear auth and restart fresh)
        this.app.post('/stabilize', async (req, res) => {
            try {
                logWithTimestamp('🔧 Force stabilizing WhatsApp connection...');
                
                // Clear auth and force fresh start
                await this.whatsappManager.forceStabilize();
                
                res.json({
                    success: true,
                    message: 'Connection stabilization initiated. Auth cleared, fresh restart in progress.',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /stabilize: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get connection diagnostics
        this.app.get('/diagnostics', (req, res) => {
            try {
                const diagnostics = this.whatsappManager.getDiagnostics();
                
                res.json({
                    success: true,
                    diagnostics: diagnostics,
                    recommendations: this.generateRecommendations(diagnostics),
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logWithTimestamp(`❌ API Error in /diagnostics: ${error.message}`, 'error');
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            logWithTimestamp(`🔥 Unhandled API error: ${error.message}`, 'error');
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                timestamp: new Date().toISOString()
            });
        });
    }

    generateRecommendations(diagnostics) {
        const recommendations = [];
        
        if (diagnostics.disconnectCount > 5) {
            recommendations.push({
                type: 'critical',
                message: 'High disconnect frequency detected. Consider stabilizing connection.',
                action: 'POST /stabilize'
            });
        }
        
        if (diagnostics.lastDisconnectReason === 440) {
            recommendations.push({
                type: 'warning',
                message: 'Session conflict detected (Reason 440). Clear auth session recommended.',
                action: 'POST /logout'
            });
        }
        
        if (diagnostics.avgReconnectTime > 10000) {
            recommendations.push({
                type: 'info',
                message: 'Slow reconnect times. Check network stability.',
                action: 'Check internet connection'
            });
        }
        
        if (diagnostics.connectionUptime < 300000) { // Less than 5 minutes
            recommendations.push({
                type: 'warning',
                message: 'Short connection uptime. Connection may be unstable.',
                action: 'Monitor connection or restart service'
            });
        }
        
        return recommendations;
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            logWithTimestamp(`🚀 API Server running on http://localhost:${this.port}`);
            logWithTimestamp(`📱 Frontend available at http://localhost:${this.port}`);
        });

        return this.server;
    }

    stop() {
        if (this.server) {
            this.server.close();
            logWithTimestamp('🛑 API Server stopped');
        }
    }
}

module.exports = APIServer;
