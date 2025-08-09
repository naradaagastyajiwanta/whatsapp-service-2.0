import requests
import json

# Test API status first
print("Testing API status...")
try:
    response = requests.get("http://localhost:3000/status")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ API is working")
            print(f"WhatsApp Connected: {data.get('whatsapp', {}).get('isConnected', False)}")
        else:
            print("❌ API responded but not successful")
    else:
        print(f"❌ API responded with error: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test file upload
print("\nTesting file upload...")
try:
    # Create a simple test file content
    files = {
        'file': ('test.txt', 'Hello World! This is a test file.', 'text/plain')
    }
    data = {
        'phoneNumber': '6287811152506',
        'caption': 'Test file upload from debug script'
    }
    
    response = requests.post("http://localhost:3000/send-file", files=files, data=data)
    print(f"Upload Status Code: {response.status_code}")
    print(f"Upload Response: {response.text}")
    
except Exception as e:
    print(f"❌ Upload Error: {e}")
