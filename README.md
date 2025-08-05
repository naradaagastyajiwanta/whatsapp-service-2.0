# WhatsApp Service 2.0

WhatsApp Service menggunakan Node.js dengan fitur lengkap untuk mengirim pesan, auto-reply, dan REST API.

## 🚀 Fitur

- ✅ Koneksi WhatsApp via QR Code (menggunakan Baileys)
- ✅ Auto-reply pesan masuk
- ✅ REST API untuk mengirim pesan
- ✅ Database SQLite untuk menyimpan riwayat pesan
- ✅ Frontend web dashboard dengan Bootstrap
- ✅ Real-time status monitoring
- ✅ Log pesan masuk dan keluar

## 📋 Prasyarat

- Node.js (versi 18 atau lebih baru)
- npm atau yarn

## 🛠️ Instalasi

1. Clone atau download project ini
2. Install dependencies:
```bash
npm install
```

3. Jalankan aplikasi:
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

## 📱 Cara Penggunaan

1. **Jalankan aplikasi** - QR Code akan muncul di terminal
2. **Scan QR Code** dengan WhatsApp mobile Anda
3. **Buka dashboard** di browser: `http://localhost:3000`
4. **Kirim pesan** melalui dashboard atau API
5. **Monitor pesan** masuk dan keluar di dashboard

## 🌐 REST API Endpoints

### 1. Kirim Pesan
```http
POST /send
Content-Type: application/json

{
  "phoneNumber": "08123456789",
  "message": "Halo dari WhatsApp Service!"
}
```

### 2. Ambil Riwayat Pesan
```http
GET /messages?limit=50&phone=+6281234567890
```

### 3. Cek Status Koneksi
```http
GET /status
```

### 4. Setting Auto Reply
```http
POST /auto-reply
Content-Type: application/json

{
  "enabled": true,
  "message": "Terima kasih! Pesan Anda telah diterima."
}
```

### 5. QR Code Management

#### Get QR Code Data
```http
GET /qr
```

#### Get QR Code as Image
```http
GET /qr/image
```

#### Reconnect WhatsApp (Generate New QR)
```http
POST /reconnect
```

#### Disconnect WhatsApp
```http
POST /disconnect
```

#### Logout WhatsApp (Remove Session)
```http
POST /logout
```

### 6. Health Check
```http
GET /health
```

## 📊 Database Schema

### Messages Table
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    from_number TEXT NOT NULL,
    to_number TEXT,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent'
);
```

### Connection Status Table
```sql
CREATE TABLE connection_status (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Struktur Project

```
whatsapp-service/
├── src/
│   ├── index.js      # Entry point aplikasi
│   ├── whatsapp.js   # WhatsApp connection manager
│   ├── api.js        # Express REST API
│   ├── db.js         # SQLite database manager
│   └── utils.js      # Helper functions
├── public/
│   └── index.html    # Frontend dashboard
├── auth/             # WhatsApp session files (auto-generated)
├── whatsapp.db       # SQLite database (auto-generated)
└── package.json
```

## 🎨 Frontend Features

Dashboard web menyediakan:
- **Form pengiriman pesan** dengan validasi nomor telepon
- **Tabel riwayat pesan** dengan auto-refresh
- **Status monitoring** koneksi WhatsApp real-time
- **Setting auto-reply** dengan toggle on/off
- **QR Code viewer** dengan modal popup untuk koneksi WhatsApp
- **Connection controls** - Reconnect, Logout, dan Show QR buttons
- **QR Code refresh** - Generate QR code baru secara manual
- **Responsive design** dengan Bootstrap 5

### 🔐 QR Code Features

1. **Show QR Code Button** - Tampilkan QR Code di modal popup
2. **Auto QR Detection** - Tombol muncul otomatis saat QR tersedia
3. **QR Code Image** - Generate QR sebagai image berkualitas tinggi
4. **Refresh QR** - Generate ulang QR code jika expired
5. **Connection Status** - Real-time status: Connected, Waiting QR, Disconnected
6. **Manual Controls**:
   - **Reconnect** - Restart koneksi WhatsApp
   - **Logout** - Hapus session dan logout dari WhatsApp
   - **Disconnect** - Putuskan koneksi sementara

## 🔧 Configuration

### Environment Variables
Anda dapat menggunakan file `.env` atau environment variables:

```env
PORT=3000
```

### Auto Reply
Auto-reply dapat diatur melalui:
1. Dashboard web (toggle switch)
2. REST API endpoint `/auto-reply`
3. Default: Enabled dengan pesan standar

## 🛡️ Error Handling

Aplikasi memiliki error handling yang komprehensif:
- ✅ Graceful shutdown
- ✅ Uncaught exception handling
- ✅ Database connection error handling
- ✅ WhatsApp disconnection auto-reconnect
- ✅ API error responses dengan status codes

## 📝 Logging

Semua aktivitas dicatat dengan timestamp:
- Koneksi/disconnection WhatsApp
- Pesan masuk dan keluar
- API requests
- Error dan warning

## 🔄 Auto-Reconnect

Aplikasi secara otomatis mencoba reconnect jika:
- Koneksi WhatsApp terputus
- Network error terjadi
- Session expired (kecuali logout manual)

## 🚨 Troubleshooting

### QR Code tidak muncul
- Pastikan tidak ada session lama di folder `auth/`
- Restart aplikasi
- Check log di terminal

### Tidak bisa kirim pesan
- Pastikan WhatsApp status "Connected"
- Check format nomor telepon (gunakan +62 atau 08)
- Pastikan nomor telepon valid dan terdaftar di WhatsApp

### Database error
- Pastikan aplikasi memiliki write permission
- Check apakah file `whatsapp.db` corrupt
- Restart aplikasi untuk recreate tables

## 📚 Dependencies

- `@whiskeysockets/baileys` - WhatsApp Web API
- `express` - Web framework
- `better-sqlite3` - SQLite database
- `qrcode-terminal` - QR code display
- `cors` - CORS middleware
- `pino` - Logging

## 🤝 Contributing

Silakan buat issue atau pull request untuk improvement atau bug fixes.

## 📄 License

ISC License

## 👨‍💻 Author

Created with ❤️ for WhatsApp automation needs.

---

**Happy coding! 🚀**
