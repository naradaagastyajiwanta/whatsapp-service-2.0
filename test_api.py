#!/usr/bin/env python3
"""
WhatsApp File Upload API Test Script
Test file upload functionality using Python requests

Dependencies:
pip install requests

Usage:
python test_api.py
"""

import requests
import os
import json
from pathlib import Path

# API Configuration
API_BASE_URL = "http://localhost:3000"
PHONE_NUMBER = "628123456789"  # Change this to your target phone number

def test_api_status():
    """Test if the API is running and WhatsApp is connected"""
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        data = response.json()
        
        print("🔄 API Status Check:")
        print(f"  Server: {'✅ Online' if response.status_code == 200 else '❌ Offline'}")
        
        if data.get('success'):
            whatsapp_status = data.get('whatsapp', {})
            print(f"  WhatsApp: {'✅ Connected' if whatsapp_status.get('isConnected') else '❌ Not Connected'}")
            print(f"  Phone: {whatsapp_status.get('phoneNumber', 'Unknown')}")
        
        return data.get('success', False)
    except Exception as e:
        print(f"❌ API Status Error: {e}")
        return False

def send_text_message(phone, message):
    """Test sending a text message"""
    try:
        response = requests.post(f"{API_BASE_URL}/send-message", json={
            "phoneNumber": phone,
            "message": message
        })
        
        data = response.json()
        if data.get('success'):
            print(f"✅ Text message sent to {phone}")
            return True
        else:
            print(f"❌ Failed to send text: {data.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Text message error: {e}")
        return False

def send_file(phone, file_path, caption=None):
    """Test sending a file"""
    try:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return False
        
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        print(f"📎 Sending file: {file_name} ({format_file_size(file_size)})")
        
        files = {'file': open(file_path, 'rb')}
        data = {'phoneNumber': phone}
        
        if caption:
            data['caption'] = caption
        
        response = requests.post(f"{API_BASE_URL}/send-file", files=files, data=data)
        
        # Close file
        files['file'].close()
        
        result = response.json()
        
        if result.get('success'):
            file_info = result.get('fileInfo', {})
            print(f"✅ File sent successfully!")
            print(f"  File: {file_info.get('fileName')}")
            print(f"  Type: {file_info.get('mimeType')}")
            print(f"  Size: {format_file_size(file_info.get('size', 0))}")
            return True
        else:
            print(f"❌ Failed to send file: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ File upload error: {e}")
        return False

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def create_test_files():
    """Create sample test files if they don't exist"""
    test_dir = Path("test_files")
    test_dir.mkdir(exist_ok=True)
    
    # Create a simple text file
    txt_file = test_dir / "test_document.txt"
    if not txt_file.exists():
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("🤖 WhatsApp File Upload Test\n\n")
            f.write("This is a test document created by the Python API test script.\n")
            f.write("If you receive this file, the file upload feature is working correctly!\n\n")
            f.write("Test Details:\n")
            f.write("- File Type: Text Document\n")
            f.write("- Encoding: UTF-8\n")
            f.write("- Created by: WhatsApp Service 2.0 Test Script\n")
    
    # Create a simple JSON file
    json_file = test_dir / "test_data.json"
    if not json_file.exists():
        test_data = {
            "test": "WhatsApp File Upload",
            "version": "2.0",
            "timestamp": "2024-01-01T00:00:00Z",
            "features": [
                "Text Messages",
                "File Upload",
                "Image Support",
                "Document Support",
                "Video Support",
                "Audio Support"
            ],
            "status": "success"
        }
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, indent=2, ensure_ascii=False)
    
    return [txt_file, json_file]

def main():
    """Main test function"""
    print("🧪 WhatsApp File Upload API Test")
    print("=" * 40)
    
    # Test API status
    if not test_api_status():
        print("\n❌ API is not ready. Please make sure:")
        print("1. WhatsApp Service is running (npm start)")
        print("2. WhatsApp is connected (scan QR code)")
        return
    
    print("\n" + "=" * 40)
    
    # Create test files
    print("📁 Creating test files...")
    test_files = create_test_files()
    print(f"✅ Created {len(test_files)} test files")
    
    # Test sending text message first
    print("\n📝 Testing text message...")
    send_text_message(PHONE_NUMBER, "🤖 Starting file upload test...")
    
    # Test file uploads
    print("\n📎 Testing file uploads...")
    for file_path in test_files:
        file_name = file_path.name
        caption = f"📋 Test file: {file_name}"
        
        print(f"\n📤 Uploading {file_name}...")
        if send_file(PHONE_NUMBER, str(file_path), caption):
            print(f"✅ {file_name} uploaded successfully!")
        else:
            print(f"❌ Failed to upload {file_name}")
    
    # Send completion message
    print("\n✅ Testing completed!")
    send_text_message(PHONE_NUMBER, "✅ File upload test completed successfully!")
    
    print("\n" + "=" * 40)
    print("📋 Test Summary:")
    print("- API Status: Checked")
    print("- Text Messages: Tested")
    print(f"- File Uploads: {len(test_files)} files tested")
    print("\nFor more advanced testing, check the test-file-upload.html file")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
