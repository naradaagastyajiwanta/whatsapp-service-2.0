# WhatsApp Service 2.0

WhatsApp Service menggunakan Node.js dengan fitur lengkap untuk mengirim pesan, file upload, auto-reply, dan REST API.

## 🚀 Fitur

- ✅ Koneksi WhatsApp via QR Code (menggunakan Baileys)
- ✅ **Kirim file** (gambar, dokumen, video, audio) - **NEW!**
- ✅ Auto-reply pesan masuk
- ✅ REST API untuk mengirim pesan dan file
- ✅ Database SQLite untuk menyimpan riwayat pesan
- ✅ Frontend web dashboard dengan Bootstrap
- ✅ Real-time status monitoring
- ✅ Log pesan masuk dan keluar
- ✅ **File preview dan upload progress** - **NEW!**

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
5. **Upload dan kirim file** melalui form file upload
6. **Monitor pesan** masuk dan keluar di dashboard

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

### 2. Kirim File - **NEW!**
```http
POST /send-file
Content-Type: multipart/form-data

Form Data:
- phoneNumber: 08123456789
- file: [selected file]
- caption: Caption untuk file (opsional)
```

**Supported file types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT, CSV
- Videos: MP4, AVI, MOV
- Audio: MP3, WAV, OGG, M4A
- Max size: 100MB

### 3. Ambil Riwayat Pesan
```http
GET /messages?limit=50&phone=+6281234567890
```

### 4. Cek Status Koneksi
```http
GET /status
```

### 5. Setting Auto Reply
```http
POST /auto-reply
Content-Type: application/json

{
  "enabled": true,
  "message": "Terima kasih! Pesan Anda telah diterima."
}
```

### 6. QR Code Management

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
- `multer` - File upload handling - **NEW!**
- `mime-types` - MIME type detection - **NEW!**
- `sharp` - Image processing - **NEW!**

## 📖 Documentation

Untuk dokumentasi yang lebih lengkap, silakan baca:

### 📎 File Upload Documentation
- **[FILE_UPLOAD_DOCUMENTATION.md](FILE_UPLOAD_DOCUMENTATION.md)** - Panduan lengkap fitur upload file
- Supported file types dan limitations
- Web interface usage guide
- Error handling dan troubleshooting

### 🔌 Complete API Documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Dokumentasi API lengkap
- All endpoints dengan examples
- Request/response formats
- Error codes dan handling
- Integration examples (cURL, JavaScript, Python, Node.js)

## 🎯 Quick Examples

### Kirim File via cURL
```bash
curl -X POST http://localhost:3000/send-file \
  -F "phoneNumber=628123456789" \
  -F "file=@document.pdf" \
  -F "caption=Here is your document"
```

### Kirim File via JavaScript
```javascript
const formData = new FormData();
formData.append('phoneNumber', '628123456789');
formData.append('file', fileInput.files[0]);
formData.append('caption', 'Optional caption');

const response = await fetch('/send-file', {
    method: 'POST',
    body: formData
});
const result = await response.json();
```

## 🧪 Testing & Development Tools

### Quick Test Suite
Gunakan script testing untuk mempercepat development:

```bash
# Windows - Jalankan quick test menu
quick-test.bat
```

Menu tersedia:
1. **Start WhatsApp Service** - Mulai layanan
2. **Open Web Interface** - Buka dashboard di browser  
3. **Open File Upload Test** - Buka halaman test khusus file upload
4. **Run Python API Test** - Test otomatis menggunakan Python
5. **Check Service Status** - Cek status layanan
6. **Stop Service** - Bantuan stop layanan
7. **View Documentation** - Buka dokumentasi

### Test Files

#### 1. Web Interface Test
- **`test-file-upload.html`** - Halaman dedicated untuk test file upload
  - Preview file sebelum upload
  - Support drag & drop
  - Real-time validation
  - API examples dan documentation
  - Status connection checker

#### 2. Python API Test Script  
- **`test_api.py`** - Script comprehensive untuk test API
  - Auto check API status
  - Test kirim text message
  - Test upload berbagai jenis file
  - Generate sample test files
  - Detailed error reporting

```bash
# Install dependencies
pip install requests

# Run test
python test_api.py
```

### Testing Workflow
1. **Start Service**: `npm start` atau gunakan quick-test.bat
2. **Scan QR Code**: Pastikan WhatsApp connected
3. **Web Testing**: Buka http://localhost:3000 atau test-file-upload.html
4. **API Testing**: Jalankan test_api.py atau gunakan cURL/Postman
5. **Integration Testing**: Test dengan aplikasi nyata

### File Upload Testing
Support test dengan file types:
- **Images**: JPEG, PNG, GIF, WebP (preview tersedia)
- **Documents**: PDF, DOC, DOCX, TXT, CSV
- **Videos**: MP4, AVI, MOV
- **Audio**: MP3, WAV, OGG, M4A

File size limit: **100MB** dengan validation otomatis.

### Debug Mode
Untuk development dengan debug output:
```bash
DEBUG=* npm start
```

## 🤝 Contributing

Silakan buat issue atau pull request untuk improvement atau bug fixes.

## 📄 License

ISC License

## 👨‍💻 Author

Created with ❤️ for WhatsApp automation needs.

---

**Happy coding! 🚀**
