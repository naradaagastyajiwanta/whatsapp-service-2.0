// Fungsi untuk membersihkan nomor telepon
function cleanPhoneNumber(phoneNumber) {
    // Hapus semua karakter non-digit
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    
    // Jika tidak dimulai dengan 62, tambahkan 62
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    
    return cleaned + '@s.whatsapp.net';
}

// Fungsi untuk format nomor telepon untuk display
function formatPhoneNumber(jid) {
    if (!jid) return '';
    
    // Ambil nomor dari JID WhatsApp
    const phoneNumber = jid.split('@')[0];
    
    // Format untuk display (62xxx -> +62 xxx)
    if (phoneNumber.startsWith('62')) {
        return '+' + phoneNumber.substring(0, 2) + ' ' + phoneNumber.substring(2);
    }
    
    return phoneNumber;
}

// Fungsi untuk mengekstrak konten pesan
function extractMessageContent(message) {
    const messageType = Object.keys(message)[0];
    
    switch (messageType) {
        case 'conversation':
            return {
                content: message.conversation,
                type: 'text'
            };
        case 'extendedTextMessage':
            return {
                content: message.extendedTextMessage.text,
                type: 'text'
            };
        case 'imageMessage':
            return {
                content: message.imageMessage.caption || '[Image]',
                type: 'image'
            };
        case 'videoMessage':
            return {
                content: message.videoMessage.caption || '[Video]',
                type: 'video'
            };
        case 'documentMessage':
            return {
                content: message.documentMessage.fileName || '[Document]',
                type: 'document'
            };
        case 'audioMessage':
            return {
                content: '[Audio]',
                type: 'audio'
            };
        case 'stickerMessage':
            return {
                content: '[Sticker]',
                type: 'sticker'
            };
        default:
            return {
                content: '[Unsupported message type]',
                type: 'unknown'
            };
    }
}

// Fungsi untuk delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk validasi nomor telepon
function isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
}

// Fungsi untuk generate ID unik untuk pesan
function generateMessageId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Fungsi untuk log dengan timestamp
function logWithTimestamp(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

module.exports = {
    cleanPhoneNumber,
    formatPhoneNumber,
    extractMessageContent,
    sleep,
    isValidPhoneNumber,
    generateMessageId,
    logWithTimestamp
};
