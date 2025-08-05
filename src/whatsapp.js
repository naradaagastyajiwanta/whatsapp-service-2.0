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
        this.autoReplyEnabled = true;
        this.autoReplyMessage = "Halo! Pesan Anda telah diterima. Terima kasih! 🙏";
    }

    async initialize() {
        try {
            logWithTimestamp('🚀 Initializing WhatsApp connection...');
            
            // Load authentication state
            const { state, saveCreds } = await useMultiFileAuthState('./auth');
            
            // Create socket connection
            this.sock = makeWASocket({
                auth: state,
                logger: this.logger,
                printQRInTerminal: false, // We'll handle QR ourselves
                defaultQueryTimeoutMs: 60000,
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

        if (qr) {
            logWithTimestamp('📱 QR Code received, please scan with your WhatsApp mobile app:');
            console.log('\n📱 SCAN QR CODE BELOW WITH YOUR WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            this.qrCode = qr;
            this.dbManager.updateConnectionStatus('waiting_qr');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            logWithTimestamp(`🔌 Connection closed. Reason: ${lastDisconnect?.error?.output?.statusCode}`, 'warn');
            
            if (shouldReconnect) {
                logWithTimestamp('🔄 Attempting to reconnect...');
                this.isConnected = false;
                this.qrCode = null;
                this.dbManager.updateConnectionStatus('reconnecting');
                setTimeout(() => this.initialize(), 3000);
            } else {
                // This is a logout, we should generate new QR automatically
                logWithTimestamp('🚪 Logged out detected, will generate new QR code');
                this.isConnected = false;
                this.qrCode = null;
                this.dbManager.updateConnectionStatus('logged_out');
                
                // Auto-restart to generate new QR after logout
                setTimeout(async () => {
                    try {
                        logWithTimestamp('🔄 Auto-generating new QR code after logout...');
                        await this.clearAuthSession();
                        await this.initialize();
                    } catch (error) {
                        logWithTimestamp(`❌ Error auto-generating QR: ${error.message}`, 'error');
                    }
                }, 3000);
            }
        } else if (connection === 'open') {
            logWithTimestamp('✅ WhatsApp connection established successfully!');
            this.isConnected = true;
            this.qrCode = null;
            this.dbManager.updateConnectionStatus('connected');
        } else if (connection === 'connecting') {
            logWithTimestamp('🔄 Connecting to WhatsApp...');
            this.dbManager.updateConnectionStatus('connecting');
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

                // Auto reply jika diaktifkan
                if (this.autoReplyEnabled && messageContent.type === 'text') {
                    await this.sendAutoReply(fromJid, message.key.id);
                }
            }
        } catch (error) {
            logWithTimestamp(`❌ Error handling incoming messages: ${error.message}`, 'error');
        }
    }

    async sendAutoReply(toJid, replyToMessageId) {
        try {
            await this.sock.sendMessage(toJid, {
                text: this.autoReplyMessage
            });

            // Simpan auto reply ke database
            const messageData = {
                messageId: Date.now().toString(),
                from: 'self',
                to: formatPhoneNumber(toJid),
                content: this.autoReplyMessage,
                type: 'text',
                direction: 'outgoing',
                status: 'sent'
            };

            this.dbManager.saveMessage(messageData);
            logWithTimestamp(`🤖 Auto reply sent to ${formatPhoneNumber(toJid)}`);
        } catch (error) {
            logWithTimestamp(`❌ Error sending auto reply: ${error.message}`, 'error');
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

    setAutoReply(enabled, message = null) {
        this.autoReplyEnabled = enabled;
        if (message) {
            this.autoReplyMessage = message;
        }
        logWithTimestamp(`🤖 Auto reply ${enabled ? 'enabled' : 'disabled'}`);
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
            logWithTimestamp('� Logging out from WhatsApp...');
            
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
            logWithTimestamp('� Initiating reconnection...');
            
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
        if (this.sock) {
            await this.sock.end();
            this.isConnected = false;
            this.qrCode = null;
            this.dbManager.updateConnectionStatus('disconnected');
            logWithTimestamp('👋 WhatsApp disconnected');
        }
    }
}

module.exports = WhatsAppManager;
