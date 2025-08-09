const { Pool } = require('pg');

class PostgresDB {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fi6YNgWrKLP5@ep-fragrant-sunset-a1e0tllz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
            ssl: {
                rejectUnauthorized: false
            },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.initTables();
    }

    async initTables() {
        try {
            // Create auth_sessions table for WhatsApp authentication
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    id SERIAL PRIMARY KEY,
                    session_key VARCHAR(255) UNIQUE NOT NULL,
                    session_data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create messages table (keep existing functionality)
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    from_number VARCHAR(50) NOT NULL,
                    to_number VARCHAR(50) NOT NULL,
                    message_text TEXT NOT NULL,
                    message_type VARCHAR(20) DEFAULT 'text',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_from_me BOOLEAN DEFAULT false,
                    status VARCHAR(20) DEFAULT 'sent'
                )
            `);

            // Create index for better performance
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_auth_sessions_key ON auth_sessions(session_key)
            `);
            
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)
            `);

            console.log('✅ PostgreSQL tables initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing PostgreSQL tables:', error);
            throw error;
        }
    }

    // Auth session methods
    async saveAuthSession(key, data) {
        try {
            // Ensure data is properly stringified
            let dataString;
            if (typeof data === 'string') {
                // If it's already a string, validate it's valid JSON
                try {
                    JSON.parse(data);
                    dataString = data;
                } catch (e) {
                    // If it's not valid JSON, stringify it
                    dataString = JSON.stringify(data);
                }
            } else if (typeof data === 'object') {
                dataString = JSON.stringify(data);
            } else {
                dataString = String(data);
            }
            
            await this.pool.query(`
                INSERT INTO auth_sessions (session_key, session_data, updated_at) 
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (session_key) 
                DO UPDATE SET 
                    session_data = EXCLUDED.session_data,
                    updated_at = CURRENT_TIMESTAMP
            `, [key, dataString]);
            
            console.log(`💾 Auth session saved to PostgreSQL: ${key}`);
        } catch (error) {
            console.error(`❌ Error saving auth session ${key}:`, error);
            throw error;
        }
    }

    async loadAuthSession(key) {
        try {
            const result = await this.pool.query(
                'SELECT session_data FROM auth_sessions WHERE session_key = $1',
                [key]
            );
            
            if (result.rows.length > 0) {
                const data = result.rows[0].session_data;
                console.log(`📖 Auth session loaded from PostgreSQL: ${key}`);
                
                // Return raw string data - let auth-state.js handle JSON parsing
                return data;
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Error loading auth session ${key}:`, error);
            return null;
        }
    }

    async removeAuthSession(key) {
        try {
            await this.pool.query(
                'DELETE FROM auth_sessions WHERE session_key = $1',
                [key]
            );
            console.log(`🗑️ Auth session removed from PostgreSQL: ${key}`);
        } catch (error) {
            console.error(`❌ Error removing auth session ${key}:`, error);
        }
    }

    async hasAuthSessions() {
        try {
            const result = await this.pool.query(
                'SELECT COUNT(*) as count FROM auth_sessions'
            );
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('❌ Error checking auth sessions:', error);
            return false;
        }
    }

    async clearAllAuthSessions() {
        try {
            await this.pool.query('DELETE FROM auth_sessions');
            console.log('🧹 All auth sessions cleared from PostgreSQL');
        } catch (error) {
            console.error('❌ Error clearing auth sessions:', error);
        }
    }

    async getAllAuthSessions() {
        try {
            const result = await this.pool.query('SELECT session_key FROM auth_sessions ORDER BY session_key');
            return result.rows.map(row => row.session_key);
        } catch (error) {
            console.error('❌ Error getting all auth sessions:', error);
            throw error;
        }
    }

    async clearCorruptedSessions() {
        try {
            // Clear any sessions that might be corrupted
            await this.pool.query('DELETE FROM auth_sessions WHERE session_key = $1', ['creds.json']);
            console.log('🧹 Cleared potentially corrupted creds.json from PostgreSQL');
        } catch (error) {
            console.error('❌ Error clearing corrupted sessions:', error);
        }
    }

    // Message methods (existing functionality)
    async saveMessage(messageData) {
        try {
            // Handle both old format (individual params) and new format (object)
            let fromNumber, toNumber, messageText, messageType, isFromMe;
            
            if (typeof messageData === 'object' && messageData.from) {
                // New object format
                fromNumber = messageData.from;
                toNumber = messageData.to || 'self';
                messageText = messageData.content || messageData.messageText;
                messageType = messageData.type || 'text';
                isFromMe = messageData.direction === 'outgoing';
            } else {
                // Old individual parameters format
                fromNumber = arguments[0];
                toNumber = arguments[1];
                messageText = arguments[2];
                messageType = arguments[3] || 'text';
                isFromMe = arguments[4] || false;
            }

            const result = await this.pool.query(`
                INSERT INTO messages (from_number, to_number, message_text, message_type, is_from_me)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [fromNumber, toNumber, messageText, messageType, isFromMe]);
            
            return result.rows[0].id;
        } catch (error) {
            console.error('❌ Error saving message to PostgreSQL:', error);
            throw error;
        }
    }

    async getMessages(limit = 50) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM messages 
                ORDER BY timestamp DESC 
                LIMIT $1
            `, [limit]);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting messages from PostgreSQL:', error);
            return [];
        }
    }

    async getMessagesByNumber(phoneNumber, limit = 50) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM messages 
                WHERE from_number = $1 OR to_number = $1
                ORDER BY timestamp DESC 
                LIMIT $2
            `, [phoneNumber, limit]);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting messages by number from PostgreSQL:', error);
            return [];
        }
    }

    // Connection management
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT NOW()');
            console.log('✅ PostgreSQL connection test successful:', result.rows[0].now);
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL connection test failed:', error);
            return false;
        }
    }

    // Compatibility method for WhatsApp connection status updates
    updateConnectionStatus(status) {
        // For PostgreSQL, we don't need to track this in the same way
        // This is mainly for compatibility with the existing WhatsApp manager
        console.log(`🔄 Connection status updated to: ${status}`);
    }

    async close() {
        try {
            await this.pool.end();
            console.log('🔌 PostgreSQL connection pool closed');
        } catch (error) {
            console.error('❌ Error closing PostgreSQL connection:', error);
        }
    }
}

module.exports = PostgresDB;
