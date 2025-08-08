const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

/**
 * Custom auth state handler yang menggunakan database
 * Menggantikan useMultiFileAuthState untuk menyimpan session di database
 */
function useDatabaseAuthState(dbManager) {
    const writeData = (data, file) => {
        try {
            const serialized = JSON.stringify(data, BufferJSON.replacer);
            dbManager.saveAuthSession(file, Buffer.from(serialized));
        } catch (error) {
            console.error(`❌ Error writing auth data to database: ${error.message}`);
        }
    };

    const readData = (file) => {
        try {
            const data = dbManager.loadAuthSession(file);
            if (data) {
                const serialized = data.toString();
                return JSON.parse(serialized, BufferJSON.reviver);
            }
        } catch (error) {
            console.error(`❌ Error reading auth data from database: ${error.message}`);
        }
        return null;
    };

    const removeData = (file) => {
        try {
            // For simplicity, we'll clear all sessions when removing
            // In production, you might want to delete specific files
            dbManager.clearAuthSessions();
        } catch (error) {
            console.error(`❌ Error removing auth data from database: ${error.message}`);
        }
    };

    // Load existing session data from database
    const creds = readData('creds.json') || initAuthCreds();
    
    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        const filename = `${type}-${id}.json`;
                        const keyData = readData(filename);
                        if (keyData) {
                            data[id] = keyData;
                        }
                    }
                    return data;
                },
                set: (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const filename = `${category}-${id}.json`;
                            writeData(data[category][id], filename);
                        }
                    }
                }
            }
        },
        saveCreds: () => {
            writeData(creds, 'creds.json');
        }
    };
}

module.exports = { useDatabaseAuthState };
