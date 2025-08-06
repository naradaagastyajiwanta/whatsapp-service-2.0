const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { cleanPhoneNumber, extractMessageContent, formatPhoneNumber, logWithTimestamp } = require('./utils');

class WhatsAppManager {
    constructor(dbManager) {
        this.sock = null;
        this.qrCode = null;
        this.isConnected = false;
        this.dbManager = dbManager;
        this.logger = pino({ level: 'silent' }); // Silent logger untuk mengurangi spam
        
        // Connection control flags
        this.isManualDisconnect = false; // Flag untuk disconnect manual
        this.shouldReconnect = true; // Flag untuk auto-reconnect
        this.heartbeatInterval = null; // Heartbeat untuk menjaga koneksi
        
        // Connection stability tracking
        this.connectionStats = {
            connectTime: null,
            disconnectCount: 0,
            lastDisconnectReason: null,
            lastDisconnectTime: null,
            reconnectAttempts: 0,
            totalReconnectTime: 0,
            connectionUptime: 0,
            isStabilizing: false,
            lastHeartbeat: null
        };
    }

    async initialize() {
        try {
            logWithTimestamp('🚀 Initializing WhatsApp connection...');
            
            // Load authentication state
            const { state, saveCreds } = await useMultiFileAuthState('./auth');
            
            // Create socket connection with improved settings
            this.sock = makeWASocket({
                auth: state,
                logger: this.logger,
                printQRInTerminal: false, // We'll handle QR ourselves
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                browser: ["WhatsApp Service", "Chrome", "1.0.0"],
                getMessage: async (key) => {
                    return {
                        conversation: "Hello, this is a WhatsApp service bot!"
                    }
                }
            });

            // Event listeners
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
            this.sock.ev.on('messages.upsert', this.handleIncomingMessages.bind(this));

            logWithTimestamp('✅ WhatsApp manager initialized successfully');
        } catch (error) {
            logWithTimestamp(`❌ Error initializing WhatsApp: ${error.message}`, 'error');
            throw error;
        }
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !this.isConnected) {
            logWithTimestamp('📱 QR Code received, please scan with your WhatsApp mobile app:');
            console.log('\n📱 SCAN QR CODE BELOW WITH YOUR WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            this.qrCode = qr;
            this.dbManager.updateConnectionStatus('waiting_qr');
        } else if (qr && this.isConnected) {
            logWithTimestamp('⚠️ QR Code received but already connected, ignoring...');
        }

        if (connection === 'close') {
            const disconnectReason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = disconnectReason !== DisconnectReason.loggedOut;
            
            // Update connection stats
            this.connectionStats.disconnectCount++;
            this.connectionStats.lastDisconnectReason = disconnectReason;
            this.connectionStats.lastDisconnectTime = Date.now();
            if (this.connectionStats.connectTime) {
                this.connectionStats.connectionUptime = Date.now() - this.connectionStats.connectTime;
            }
            
            logWithTimestamp(`🔌 Connection closed. Reason: ${disconnectReason}`, 'warn');
            
            // Jika ini adalah manual disconnect, jangan auto-reconnect
            if (this.isManualDisconnect) {
                logWithTimestamp('🛑 Manual disconnect detected - skipping auto-reconnect');
                this.isConnected = false;
                this.qrCode = null;
                this.stopHeartbeat();
                this.dbManager.updateConnectionStatus('disconnected');
                this.isManualDisconnect = false; // Reset flag
                return;
            }
            
            // Handle different disconnect reasons
            if (disconnectReason === DisconnectReason.badSession) {
                logWithTimestamp('⚠️ Bad session detected - clearing auth and restarting', 'warn');
                this.isConnected = false;
                this.qrCode = null;
                this.clearAuthSession().then(() => {
                    setTimeout(() => this.initialize(), 3000);
                });
                return;
            }
            
            if (disconnectReason === DisconnectReason.restartRequired) {
                logWithTimestamp('🔄 Restart required - reinitializing connection', 'warn');
                this.isConnected = false;
                this.qrCode = null;
                setTimeout(() => this.initialize(), 2000);
                return;
            }
            
            // Check for problematic disconnect reason 440
            if (disconnectReason === 440) {
                logWithTimestamp('⚠️ Reason 440 detected - Session conflict or auth issue', 'warn');
                
                // If too many 440 errors, force stabilize
                if (this.connectionStats.disconnectCount > 3 && !this.connectionStats.isStabilizing) {
                    logWithTimestamp('🔧 Auto-stabilizing connection due to repeated 440 errors...');
                    setTimeout(() => this.forceStabilize(), 5000);
                    return;
                }
            }
            
            if (shouldReconnect && this.shouldReconnect) {
                logWithTimestamp('🔄 Attempting to reconnect...');
                this.isConnected = false;
                this.qrCode = null;
                this.dbManager.updateConnectionStatus('reconnecting');
                
                // Progressive delay based on disconnect count to prevent rapid reconnection
                let delay = 3000;
                if (this.connectionStats.disconnectCount > 5) delay = 10000;
                else if (this.connectionStats.disconnectCount > 2) delay = 6000;
                
                setTimeout(() => {
                    this.connectionStats.reconnectAttempts++;
                    const reconnectStart = Date.now();
                    this.initialize().then(() => {
                        this.connectionStats.totalReconnectTime += Date.now() - reconnectStart;
                    });
                }, delay);
            } else {
                // This is a logout, we should generate new QR automatically only if not connected
                logWithTimestamp('🚪 Logged out detected');
                this.isConnected = false;
                this.qrCode = null;
                this.stopHeartbeat();
                this.dbManager.updateConnectionStatus('logged_out');
                
                // Only auto-restart after logout if we were previously connected
                if (this.connectionStats.connectTime) {
                    logWithTimestamp('🔄 Auto-generating new QR code after logout...');
                    setTimeout(async () => {
                        try {
                            await this.clearAuthSession();
                            await this.initialize();
                        } catch (error) {
                            logWithTimestamp(`❌ Error auto-generating QR: ${error.message}`, 'error');
                        }
                    }, 5000);
                }
            }
        } else if (connection === 'open') {
            logWithTimestamp('✅ WhatsApp connection established successfully!');
            this.isConnected = true;
            this.qrCode = null;
            this.connectionStats.connectTime = Date.now();
            this.connectionStats.isStabilizing = false;
            this.connectionStats.disconnectCount = 0; // Reset disconnect count on successful connection
            this.dbManager.updateConnectionStatus('connected');
            
            // Start heartbeat to keep connection alive
            this.startHeartbeat();
        } else if (connection === 'connecting') {
            logWithTimestamp('🔄 Connecting to WhatsApp...');
            this.dbManager.updateConnectionStatus('connecting');
        }
    }

    // Start heartbeat to keep connection alive
    startHeartbeat() {
        // Clear existing heartbeat if any
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Send heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.sock) {
                try {
                    // Send a simple presence update to keep connection alive
                    this.sock.sendPresenceUpdate('available');
                    this.connectionStats.lastHeartbeat = Date.now();
                    logWithTimestamp('💓 Heartbeat sent', 'debug');
                } catch (error) {
                    logWithTimestamp(`❌ Heartbeat failed: ${error.message}`, 'warn');
                }
            }
        }, 30000); // 30 seconds
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            logWithTimestamp('💔 Heartbeat stopped');
        }
    }

    async handleIncomingMessages(messageInfo) {
        try {
            const { messages } = messageInfo;
            
            for (const message of messages) {
                // Skip jika pesan dari diri sendiri atau tidak ada konten
                if (message.key.fromMe || !message.message) continue;

                const fromJid = message.key.remoteJid;
                const messageContent = extractMessageContent(message.message);
                
                // Simpan pesan masuk ke database
                const messageData = {
                    messageId: message.key.id,
                    from: formatPhoneNumber(fromJid),
                    to: 'self',
                    content: messageContent.content,
                    type: messageContent.type,
                    direction: 'incoming',
                    status: 'received'
                };

                this.dbManager.saveMessage(messageData);

                logWithTimestamp(`📨 Incoming message from ${formatPhoneNumber(fromJid)}: ${messageContent.content}`);
            }
        } catch (error) {
            logWithTimestamp(`❌ Error handling incoming messages: ${error.message}`, 'error');
        }
    }

    async sendMessage(phoneNumber, messageText) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp is not connected');
            }

            const jid = cleanPhoneNumber(phoneNumber);
            
            // Kirim pesan
            const sentMessage = await this.sock.sendMessage(jid, {
                text: messageText
            });

            // Simpan pesan keluar ke database
            const messageData = {
                messageId: sentMessage.key.id,
                from: 'self',
                to: formatPhoneNumber(jid),
                content: messageText,
                type: 'text',
                direction: 'outgoing',
                status: 'sent'
            };

            this.dbManager.saveMessage(messageData);

            logWithTimestamp(`📤 Message sent to ${formatPhoneNumber(jid)}: ${messageText}`);
            
            return {
                success: true,
                messageId: sentMessage.key.id,
                to: formatPhoneNumber(jid),
                message: 'Message sent successfully'
            };
        } catch (error) {
            logWithTimestamp(`❌ Error sending message: ${error.message}`, 'error');
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            hasQR: !!this.qrCode,
            qrCode: this.qrCode,
            status: this.isConnected ? 'connected' : (this.qrCode ? 'waiting_qr' : 'disconnected')
        };
    }

    async clearAuthSession() {
        try {
            logWithTimestamp('🗑️ Clearing authentication session...');
            
            const authPath = path.join(process.cwd(), 'auth');
            
            if (fs.existsSync(authPath)) {
                // Remove all auth files
                const files = fs.readdirSync(authPath);
                for (const file of files) {
                    const filePath = path.join(authPath, file);
                    fs.unlinkSync(filePath);
                }
                logWithTimestamp('✅ Authentication session cleared');
            }
        } catch (error) {
            logWithTimestamp(`❌ Error clearing auth session: ${error.message}`, 'error');
        }
    }

    async logout() {
        try {
            logWithTimestamp('🚪 Logging out from WhatsApp...');
            
            this.stopHeartbeat();
            
            if (this.sock) {
                await this.sock.logout();
            }
            
            this.isConnected = false;
            this.qrCode = null;
            this.dbManager.updateConnectionStatus('logged_out');
            
            // Clear authentication session to force new QR generation
            await this.clearAuthSession();
            
            logWithTimestamp('✅ Successfully logged out from WhatsApp');
            
            // Auto-restart connection to generate new QR code
            logWithTimestamp('🔄 Auto-restarting connection to generate new QR code...');
            setTimeout(async () => {
                try {
                    await this.initialize();
                } catch (error) {
                    logWithTimestamp(`❌ Error auto-restarting after logout: ${error.message}`, 'error');
                }
            }, 2000);
            
        } catch (error) {
            logWithTimestamp(`❌ Error during logout: ${error.message}`, 'error');
            throw error;
        }
    }

    async reconnect() {
        try {
            logWithTimestamp('🔄 Initiating reconnection...');
            
            this.stopHeartbeat();
            
            // End current connection if exists
            if (this.sock) {
                try {
                    await this.sock.end();
                } catch (error) {
                    logWithTimestamp(`⚠️ Warning during socket end: ${error.message}`, 'warn');
                }
            }
            
            this.isConnected = false;
            this.qrCode = null;
            this.dbManager.updateConnectionStatus('reconnecting');
            
            // Wait a bit before reconnecting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.initialize();
            logWithTimestamp('✅ Reconnection initiated successfully');
        } catch (error) {
            logWithTimestamp(`❌ Error during reconnection: ${error.message}`, 'error');
            throw error;
        }
    }

    async disconnect() {
        try {
            logWithTimestamp('🛑 Manual disconnect requested...');
            
            // Set flag untuk manual disconnect
            this.isManualDisconnect = true;
            this.stopHeartbeat();
            
            if (this.sock) {
                await this.sock.end();
                this.isConnected = false;
                this.qrCode = null;
                this.dbManager.updateConnectionStatus('disconnected');
                logWithTimestamp('👋 WhatsApp disconnected manually');
            } else {
                // Jika tidak ada socket, tetap update status
                this.isConnected = false;
                this.qrCode = null;
                this.dbManager.updateConnectionStatus('disconnected');
                logWithTimestamp('👋 WhatsApp disconnected (no active connection)');
            }
        } catch (error) {
            logWithTimestamp(`❌ Error during manual disconnect: ${error.message}`, 'error');
            // Reset flag jika error
            this.isManualDisconnect = false;
            throw error;
        }
    }

    async reconnectManual() {
        try {
            logWithTimestamp('🔄 Manual reconnect requested...');
            
            // Reset flags untuk manual reconnect
            this.isManualDisconnect = false;
            this.shouldReconnect = true;
            this.stopHeartbeat();
            
            // Jika sudah ada koneksi, disconnect dulu
            if (this.sock) {
                await this.sock.end();
            }
            
            // Reset state
            this.isConnected = false;
            this.qrCode = null;
            
            // Initialize ulang
            await this.initialize();
            logWithTimestamp('✅ Manual reconnection initiated successfully');
        } catch (error) {
            logWithTimestamp(`❌ Error during manual reconnection: ${error.message}`, 'error');
            throw error;
        }
    }

    // Get connection stability information
    getConnectionStability() {
        const now = Date.now();
        const avgReconnectTime = this.connectionStats.reconnectAttempts > 0 
            ? this.connectionStats.totalReconnectTime / this.connectionStats.reconnectAttempts 
            : 0;

        return {
            disconnectCount: this.connectionStats.disconnectCount,
            lastDisconnectReason: this.connectionStats.lastDisconnectReason,
            lastDisconnectTime: this.connectionStats.lastDisconnectTime,
            reconnectAttempts: this.connectionStats.reconnectAttempts,
            avgReconnectTime: Math.round(avgReconnectTime),
            connectionUptime: this.connectionStats.connectTime 
                ? now - this.connectionStats.connectTime 
                : this.connectionStats.connectionUptime,
            isStabilizing: this.connectionStats.isStabilizing,
            lastHeartbeat: this.connectionStats.lastHeartbeat,
            hasHeartbeat: !!this.heartbeatInterval
        };
    }

    // Get comprehensive diagnostics
    getDiagnostics() {
        const stability = this.getConnectionStability();
        const connectionStatus = this.getConnectionStatus();
        
        return {
            ...stability,
            currentStatus: connectionStatus,
            authFilesExist: fs.existsSync('./auth'),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    // Force stabilize connection (nuclear option for persistent issues)
    async forceStabilize() {
        try {
            this.connectionStats.isStabilizing = true;
            logWithTimestamp('🔧 Force stabilizing WhatsApp connection...');
            
            // Step 1: Disconnect current session
            if (this.sock) {
                try {
                    await this.sock.end();
                } catch (error) {
                    logWithTimestamp(`⚠️ Error ending socket: ${error.message}`, 'warn');
                }
            }
            
            // Step 2: Clear authentication session
            await this.clearAuthSession();
            
            // Step 3: Reset connection stats
            this.connectionStats = {
                connectTime: null,
                disconnectCount: 0,
                lastDisconnectReason: null,
                lastDisconnectTime: null,
                reconnectAttempts: 0,
                totalReconnectTime: 0,
                connectionUptime: 0,
                isStabilizing: true
            };
            
            // Step 4: Reset state
            this.isConnected = false;
            this.qrCode = null;
            this.sock = null;
            
            // Step 5: Wait longer before reinitializing
            logWithTimestamp('⏳ Waiting 15 seconds before fresh initialization...');
            setTimeout(async () => {
                try {
                    await this.initialize();
                    logWithTimestamp('✅ Force stabilization completed');
                } catch (error) {
                    logWithTimestamp(`❌ Error during force stabilization: ${error.message}`, 'error');
                    this.connectionStats.isStabilizing = false;
                }
            }, 15000);
            
        } catch (error) {
            logWithTimestamp(`❌ Error in force stabilization: ${error.message}`, 'error');
            this.connectionStats.isStabilizing = false;
            throw error;
        }
    }
}

module.exports = WhatsAppManager;
