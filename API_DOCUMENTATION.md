# 🔌 WhatsApp Service 2.0 - Complete API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Response Format](#response-format)
5. [Endpoints](#endpoints)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

## 🎯 Overview

WhatsApp Service 2.0 menyediakan REST API untuk mengirim pesan teks dan file melalui WhatsApp. API ini menggunakan library Baileys untuk koneksi WhatsApp dan menyimpan data di database SQLite.

### Features
- ✅ Send text messages
- ✅ Send files (images, documents, videos, audio)
- ✅ Message history
- ✅ Connection status monitoring
- ✅ QR code generation for authentication
- ✅ Real-time connection management

## 🔐 Authentication

Saat ini API tidak memerlukan authentication key, namun WhatsApp harus terkoneksi terlebih dahulu melalui QR code scanning.

## 🌐 Base URL

```
http://localhost:3000
```

Untuk deployment production, ganti dengan domain/IP server Anda.

## 📊 Response Format

Semua response menggunakan format JSON dengan struktur standar:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

## 📡 Endpoints

### 1. Health Check

**GET** `/health`

Memeriksa status API server.

#### Response
```json
{
  "status": "ok",
  "timestamp": "2025-08-09T01:54:32.123Z",
  "service": "WhatsApp Service API"
}
```

---

### 2. Get Connection Status

**GET** `/status`

Mendapatkan status koneksi WhatsApp dan informasi sistem.

#### Response
```json
{
  "success": true,
  "whatsapp": {
    "isConnected": true,
    "hasQR": false,
    "qrCode": null,
    "status": "connected",
    "connectionStats": {
      "connectTime": 1691537672123,
      "disconnectCount": 0,
      "reconnectAttempts": 0,
      "connectionUptime": 300000,
      "isStabilizing": false,
      "lastHeartbeat": 1691537672123
    }
  },
  "database": {
    "isConnected": true,
    "totalMessages": 25,
    "lastMessage": "2025-08-09T01:54:32.123Z"
  },
  "system": {
    "uptime": 3600000,
    "memory": {
      "used": 45.6,
      "total": 512.0
    },
    "nodeVersion": "18.17.0"
  },
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

#### Status Values
- `connected` - WhatsApp tersambung dan siap
- `connecting` - Sedang mencoba koneksi
- `waiting_qr` - Menunggu scan QR code
- `disconnected` - Tidak tersambung

---

### 3. Send Text Message

**POST** `/send`

Mengirim pesan teks ke nomor WhatsApp.

#### Headers
```
Content-Type: application/json
```

#### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumber` | string | ✅ Yes | Nomor WhatsApp tujuan |
| `message` | string | ✅ Yes | Isi pesan yang akan dikirim |

#### Request Example
```json
{
  "phoneNumber": "628123456789",
  "message": "Hello from WhatsApp Service!"
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "3EB0C431C5D42A59B8C8",
    "to": "+62 812-3456-789",
    "message": "Message sent successfully"
  },
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

#### Phone Number Formats
- `08123456789` (Indonesian format)
- `+628123456789` (International format)
- `628123456789` (Country code format)

---

### 4. Send File

**POST** `/send-file`

Mengirim file ke nomor WhatsApp.

#### Headers
```
Content-Type: multipart/form-data
```

#### Form Data Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumber` | string | ✅ Yes | Nomor WhatsApp tujuan |
| `file` | file | ✅ Yes | File yang akan dikirim |
| `caption` | string | ❌ No | Caption untuk file (opsional) |

#### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT, CSV
- **Videos**: MP4, AVI, MOV
- **Audio**: MP3, WAV, OGG, M4A

#### File Limitations
- Maximum size: 100 MB
- File extension must match MIME type

#### Response Example
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "3EB0C431C5D42A59B8C8",
    "to": "+62 812-3456-789",
    "fileName": "document.pdf",
    "fileType": "document",
    "message": "File sent successfully"
  },
  "fileInfo": {
    "fileName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 156789
  },
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

---

### 5. Get Messages History

**GET** `/messages`

Mendapatkan riwayat pesan.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | ❌ No | Jumlah pesan (default: 100) |
| `phone` | string | ❌ No | Filter berdasarkan nomor HP |

#### Request Examples
```
GET /messages?limit=50
GET /messages?phone=628123456789
GET /messages?limit=20&phone=628123456789
```

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "messageId": "3EB0C431C5D42A59B8C8",
      "from": "628123456789",
      "to": "self",
      "content": "Hello!",
      "type": "text",
      "direction": "incoming",
      "status": "received",
      "timestamp": "2025-08-09T01:54:32.123Z"
    },
    {
      "id": 2,
      "messageId": "4FB1D542D6E53B60C9D9",
      "from": "self",
      "to": "628123456789",
      "content": "Hi there!",
      "type": "text",
      "direction": "outgoing",
      "status": "sent",
      "timestamp": "2025-08-09T01:55:15.456Z"
    }
  ],
  "count": 2,
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

#### Message Types
- `text` - Pesan teks
- `image` - Gambar
- `video` - Video
- `audio` - Audio
- `document` - Dokumen

#### Message Direction
- `incoming` - Pesan masuk
- `outgoing` - Pesan keluar

---

### 6. Get QR Code

**GET** `/qr`

Mendapatkan QR code untuk autentikasi WhatsApp (dalam format text).

#### Response Example
```json
{
  "success": true,
  "qrCode": "2@3QN8+hGq7nL...",
  "message": "QR Code available for scanning"
}
```

---

### 7. Get QR Code Image

**GET** `/qr/image`

Mendapatkan QR code dalam format gambar PNG.

#### Response
- **Content-Type**: `image/png`
- **Body**: Binary PNG image data

#### Usage Example
```html
<img src="http://localhost:3000/qr/image" alt="WhatsApp QR Code" />
```

---

### 8. Connection Management

#### Reconnect WhatsApp

**POST** `/reconnect`

Memulai ulang koneksi WhatsApp.

#### Response
```json
{
  "success": true,
  "message": "Reconnection initiated"
}
```

#### Logout WhatsApp

**POST** `/logout`

Logout dan hapus sesi WhatsApp.

#### Response
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## ⚠️ Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (Invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Messages

#### Connection Errors
```json
{
  "success": false,
  "error": "WhatsApp is not connected"
}
```

#### Validation Errors
```json
{
  "success": false,
  "error": "Phone number and message are required"
}
```

```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

#### File Upload Errors
```json
{
  "success": false,
  "error": "File size too large. Maximum 100MB allowed"
}
```

```json
{
  "success": false,
  "error": "File type application/zip not supported"
}
```

---

## 🔄 Rate Limiting

Saat ini tidak ada rate limiting yang diterapkan, namun disarankan untuk:
- Maksimal 20 pesan per menit
- Maksimal 5 file upload per menit
- Interval minimal 1 detik antar request

---

## 💡 Examples

### cURL Examples

#### Send Text Message
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "628123456789",
    "message": "Hello from API!"
  }'
```

#### Send File
```bash
curl -X POST http://localhost:3000/send-file \
  -F "phoneNumber=628123456789" \
  -F "file=@document.pdf" \
  -F "caption=Here is your document"
```

#### Get Messages
```bash
curl http://localhost:3000/messages?limit=10
```

#### Check Status
```bash
curl http://localhost:3000/status
```

### JavaScript Examples

#### Send Message with Fetch
```javascript
async function sendMessage(phoneNumber, message) {
  try {
    const response = await fetch('http://localhost:3000/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        message: message
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Message sent:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Usage
sendMessage('628123456789', 'Hello from JavaScript!');
```

#### Send File with Fetch
```javascript
async function sendFile(phoneNumber, file, caption = '') {
  const formData = new FormData();
  formData.append('phoneNumber', phoneNumber);
  formData.append('file', file);
  if (caption) {
    formData.append('caption', caption);
  }
  
  try {
    const response = await fetch('http://localhost:3000/send-file', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('File sent:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

#### Check Connection Status
```javascript
async function checkStatus() {
  try {
    const response = await fetch('http://localhost:3000/status');
    const status = await response.json();
    
    console.log('WhatsApp Status:', status.whatsapp.status);
    console.log('Connected:', status.whatsapp.isConnected);
    
    return status;
  } catch (error) {
    console.error('Error checking status:', error);
  }
}
```

### Python Examples

#### Send Message
```python
import requests
import json

def send_message(phone_number, message):
    url = 'http://localhost:3000/send'
    data = {
        'phoneNumber': phone_number,
        'message': message
    }
    
    response = requests.post(url, json=data)
    result = response.json()
    
    if result['success']:
        print(f"Message sent: {result['data']}")
    else:
        print(f"Error: {result['error']}")

# Usage
send_message('628123456789', 'Hello from Python!')
```

#### Send File
```python
import requests

def send_file(phone_number, file_path, caption=''):
    url = 'http://localhost:3000/send-file'
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'phoneNumber': phone_number,
            'caption': caption
        }
        
        response = requests.post(url, files=files, data=data)
        result = response.json()
        
        if result['success']:
            print(f"File sent: {result['data']}")
        else:
            print(f"Error: {result['error']}")

# Usage
send_file('628123456789', '/path/to/document.pdf', 'Your document')
```

#### Get Messages
```python
import requests

def get_messages(limit=100, phone=None):
    url = 'http://localhost:3000/messages'
    params = {'limit': limit}
    
    if phone:
        params['phone'] = phone
    
    response = requests.get(url, params=params)
    result = response.json()
    
    if result['success']:
        print(f"Found {result['count']} messages")
        for msg in result['data']:
            print(f"{msg['timestamp']}: {msg['content']}")
    else:
        print(f"Error: {result['error']}")

# Usage
get_messages(limit=10)
get_messages(phone='628123456789')
```

### Node.js Examples

#### Send Message with Axios
```javascript
const axios = require('axios');

async function sendMessage(phoneNumber, message) {
  try {
    const response = await axios.post('http://localhost:3000/send', {
      phoneNumber: phoneNumber,
      message: message
    });
    
    if (response.data.success) {
      console.log('Message sent:', response.data.data);
    } else {
      console.error('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

// Usage
sendMessage('628123456789', 'Hello from Node.js!');
```

#### Send File with FormData
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function sendFile(phoneNumber, filePath, caption = '') {
  try {
    const form = new FormData();
    form.append('phoneNumber', phoneNumber);
    form.append('file', fs.createReadStream(filePath));
    if (caption) {
      form.append('caption', caption);
    }
    
    const response = await axios.post('http://localhost:3000/send-file', form, {
      headers: form.getHeaders()
    });
    
    if (response.data.success) {
      console.log('File sent:', response.data.data);
    } else {
      console.error('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

// Usage
sendFile('628123456789', './document.pdf', 'Your document');
```

---

## 🔍 Monitoring & Debugging

### Health Check Endpoint
Gunakan `/health` untuk monitoring otomatis:

```bash
# Simple health check
curl http://localhost:3000/health

# With response time measurement
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
```

### Connection Status Monitoring
```javascript
// Check connection every 30 seconds
setInterval(async () => {
  try {
    const response = await fetch('http://localhost:3000/status');
    const status = await response.json();
    
    if (!status.whatsapp.isConnected) {
      console.warn('WhatsApp disconnected!');
      // Implement reconnection logic or alert
    }
  } catch (error) {
    console.error('Status check failed:', error);
  }
}, 30000);
```

---

## 🚀 Best Practices

1. **Always check connection status** before sending messages
2. **Implement retry logic** for failed requests
3. **Use appropriate timeouts** for file uploads
4. **Validate phone numbers** before sending
5. **Handle rate limiting** gracefully
6. **Monitor API health** regularly
7. **Log errors** for debugging
8. **Use HTTPS** in production

---

## 📞 Support

Untuk dukungan teknis atau pertanyaan lainnya:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: your-email@domain.com
- Documentation: README.md

---

## 📝 Changelog

### Version 2.0.0
- ✅ Added file upload support
- ✅ Enhanced API documentation
- ✅ Improved error handling
- ✅ Added connection monitoring
- ✅ Better status reporting

### Version 1.0.0
- ✅ Basic text message sending
- ✅ WhatsApp authentication
- ✅ Message history
- ✅ Basic API endpoints
