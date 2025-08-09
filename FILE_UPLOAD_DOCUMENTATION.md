# 📎 WhatsApp File Upload Documentation

## Overview
WhatsApp Service 2.0 mendukung pengiriman berbagai jenis file melalui API REST dan Web Interface. Fitur ini memungkinkan Anda mengirim gambar, dokumen, video, audio, dan file lainnya ke nomor WhatsApp.

## 🎯 Supported File Types

### Images
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

### Documents
- **PDF** (.pdf)
- **Microsoft Word** (.doc, .docx)
- **Microsoft Excel** (.xls, .xlsx)
- **Text Files** (.txt)
- **CSV** (.csv)

### Videos
- **MP4** (.mp4)
- **AVI** (.avi)
- **MOV** (.mov)
- **QuickTime** (.quicktime)

### Audio
- **MP3** (.mp3)
- **WAV** (.wav)
- **OGG** (.ogg)
- **MP4 Audio** (.m4a)

## 📋 File Limitations

- **Maximum File Size**: 100 MB
- **Upload Method**: Multipart form-data
- **Caption**: Optional, supports text with emojis
- **File Name**: Preserved from original upload

## 🔧 API Endpoint

### Send File
**POST** `/send-file`

#### Headers
```
Content-Type: multipart/form-data
```

#### Form Data Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumber` | string | ✅ Yes | WhatsApp number (08xxx, +62xxx, 62xxx) |
| `file` | file | ✅ Yes | File to be sent |
| `caption` | string | ❌ No | Optional caption for the file |

#### Example Request (cURL)
```bash
curl -X POST http://localhost:3000/send-file \
  -F "phoneNumber=628123456789" \
  -F "file=@/path/to/your/document.pdf" \
  -F "caption=Here is the document you requested"
```

#### Example Request (JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('phoneNumber', '628123456789');
formData.append('file', fileInput.files[0]);
formData.append('caption', 'Optional caption here');

const response = await fetch('http://localhost:3000/send-file', {
    method: 'POST',
    body: formData
});

const result = await response.json();
console.log(result);
```

#### Example Request (Python)
```python
import requests

url = 'http://localhost:3000/send-file'
files = {
    'file': ('document.pdf', open('/path/to/document.pdf', 'rb'))
}
data = {
    'phoneNumber': '628123456789',
    'caption': 'Here is your document'
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

#### Success Response
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

#### Error Response
```json
{
  "success": false,
  "error": "File size too large. Maximum 100MB allowed",
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

## 🌐 Web Interface Usage

### Step-by-Step Guide

1. **Open Dashboard**
   ```
   http://localhost:3000
   ```

2. **Navigate to File Upload Section**
   - Scroll down to "Send File to WhatsApp" card
   - Located below the text message section

3. **Fill Required Fields**
   - **Phone Number**: Enter target WhatsApp number
   - **Select File**: Click "Choose File" and select your file
   - **Caption**: (Optional) Add description or message

4. **Preview File**
   - After selecting file, preview will show:
     - File name and size
     - File type icon
     - Image thumbnail (for images)

5. **Send File**
   - Click "Send File" button
   - Wait for confirmation message
   - Check message history for delivery status

### File Preview Features
- **Real-time preview** of selected files
- **File size validation** before upload
- **File type icons** for different formats
- **Image thumbnails** for picture files
- **Progress indicators** during upload

## 🔍 Message Types in Database

When files are sent, they are stored in the database with different message types:

| File Type | Message Type | Description |
|-----------|--------------|-------------|
| Images | `image` | JPEG, PNG, GIF, WebP files |
| Videos | `video` | MP4, AVI, MOV files |
| Audio | `audio` | MP3, WAV, OGG files |
| Documents | `document` | PDF, DOC, TXT, and other files |

## 📊 File Information Storage

Each file message includes metadata:

```json
{
  "messageId": "unique_message_id",
  "from": "self",
  "to": "+62 812-3456-789",
  "content": "Caption text or 'File: filename.ext'",
  "type": "document",
  "direction": "outgoing",
  "status": "sent",
  "fileInfo": {
    "fileName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 156789
  },
  "timestamp": "2025-08-09T01:54:32.123Z"
}
```

## ⚠️ Error Handling

### Common Errors

1. **File Too Large**
   ```json
   {
     "success": false,
     "error": "File size too large. Maximum 100MB allowed"
   }
   ```

2. **Unsupported File Type**
   ```json
   {
     "success": false,
     "error": "File type application/zip not supported"
   }
   ```

3. **Missing Phone Number**
   ```json
   {
     "success": false,
     "error": "Phone number is required"
   }
   ```

4. **No File Selected**
   ```json
   {
     "success": false,
     "error": "File is required"
   }
   ```

5. **WhatsApp Not Connected**
   ```json
   {
     "success": false,
     "error": "WhatsApp is not connected"
   }
   ```

## 🔒 Security Features

- **File type validation** on server side
- **File size limits** to prevent abuse
- **MIME type checking** for security
- **Memory-based storage** (files not saved to disk)
- **Automatic cleanup** after sending

## 💡 Best Practices

### For Developers
1. **Always validate file size** before uploading
2. **Check connection status** before sending
3. **Handle errors gracefully** with user feedback
4. **Use appropriate file types** for better delivery
5. **Add meaningful captions** for context

### For Users
1. **Compress large files** when possible
2. **Use appropriate file formats** (PDF for documents, JPEG for photos)
3. **Check file size** before uploading
4. **Ensure WhatsApp is connected** before sending
5. **Add captions** for better context

## 🧪 Testing

### Test File Upload
```bash
# Test with a small image
curl -X POST http://localhost:3000/send-file \
  -F "phoneNumber=628123456789" \
  -F "file=@test-image.jpg" \
  -F "caption=Test image upload"

# Test with a PDF document
curl -X POST http://localhost:3000/send-file \
  -F "phoneNumber=628123456789" \
  -F "file=@document.pdf" \
  -F "caption=Test PDF upload"
```

### JavaScript Test Function
```javascript
function testFileUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('phoneNumber', '628123456789');
        formData.append('file', file);
        formData.append('caption', 'Test upload');
        
        try {
            const response = await fetch('/send-file', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            console.log('Upload result:', result);
        } catch (error) {
            console.error('Upload error:', error);
        }
    };
    fileInput.click();
}
```

## 🔄 Integration Examples

### React Component
```jsx
import React, { useState } from 'react';

function FileUploader() {
    const [file, setFile] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file || !phoneNumber) return;
        
        setLoading(true);
        const formData = new FormData();
        formData.append('phoneNumber', phoneNumber);
        formData.append('file', file);
        formData.append('caption', caption);

        try {
            const response = await fetch('/send-file', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                alert('File sent successfully!');
                setFile(null);
                setCaption('');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <input
                type="text"
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            />
            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Sending...' : 'Send File'}
            </button>
        </div>
    );
}

export default FileUploader;
```

## 🎉 Conclusion

Fitur file upload di WhatsApp Service 2.0 memberikan kemampuan lengkap untuk mengirim berbagai jenis file dengan mudah dan aman. Dengan API yang sederhana dan interface web yang user-friendly, Anda dapat mengintegrasikan fitur ini ke dalam aplikasi apapun.

Untuk dukungan lebih lanjut, silakan cek dokumentasi API lengkap atau hubungi tim pengembangan.
