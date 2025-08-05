const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
    constructor() {
        const dbPath = path.join(__dirname, '..', 'whatsapp.db');
        this.db = new Database(dbPath);
        this.initTables();
    }

    initTables() {
        // Tabel untuk menyimpan pesan
        const createMessagesTable = `
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT UNIQUE,
                from_number TEXT NOT NULL,
                to_number TEXT,
                message_content TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'sent'
            )
        `;

        // Tabel untuk menyimpan status koneksi
        const createConnectionTable = `
            CREATE TABLE IF NOT EXISTS connection_status (
                id INTEGER PRIMARY KEY,
                status TEXT NOT NULL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.exec(createMessagesTable);
        this.db.exec(createConnectionTable);

        // Insert default connection status
        const checkConnection = this.db.prepare("SELECT COUNT(*) as count FROM connection_status").get();
        if (checkConnection.count === 0) {
            this.db.prepare("INSERT INTO connection_status (id, status) VALUES (1, 'disconnected')").run();
        }

        console.log('✅ Database tables initialized successfully');
    }

    // Simpan pesan ke database
    saveMessage(messageData) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO messages 
            (message_id, from_number, to_number, message_content, message_type, direction, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        try {
            const result = stmt.run(
                messageData.messageId,
                messageData.from,
                messageData.to,
                messageData.content,
                messageData.type || 'text',
                messageData.direction,
                messageData.status || 'sent'
            );
            console.log(`💾 Message saved to database with ID: ${result.lastInsertRowid}`);
            return result;
        } catch (error) {
            console.error('❌ Error saving message to database:', error);
            throw error;
        }
    }

    // Ambil semua pesan
    getAllMessages(limit = 100) {
        const stmt = this.db.prepare(`
            SELECT * FROM messages 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // Ambil pesan berdasarkan nomor
    getMessagesByNumber(phoneNumber, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT * FROM messages 
            WHERE from_number = ? OR to_number = ?
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        return stmt.all(phoneNumber, phoneNumber, limit);
    }

    // Update status koneksi
    updateConnectionStatus(status) {
        const stmt = this.db.prepare(`
            UPDATE connection_status 
            SET status = ?, last_updated = CURRENT_TIMESTAMP 
            WHERE id = 1
        `);
        stmt.run(status);
        console.log(`🔄 Connection status updated to: ${status}`);
    }

    // Ambil status koneksi
    getConnectionStatus() {
        const stmt = this.db.prepare("SELECT * FROM connection_status WHERE id = 1");
        return stmt.get();
    }

    // Tutup koneksi database
    close() {
        this.db.close();
        console.log('🔒 Database connection closed');
    }
}

module.exports = DatabaseManager;
