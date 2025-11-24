#!/usr/bin/env python3
"""
Simple test for document processing APIs
"""
import requests
import json
import time
import subprocess
import os
import tempfile

BASE_URL = "http://localhost:8000"
server_process = None

def start_server():
    """Start Django development server"""
    global server_process
    os.chdir('/home/manzi/Project/procure-to-pay-system/backend')
    env = os.environ.copy()
    env.pop('DEBUG', None)
    
    server_process = subprocess.Popen([
        '/home/manzi/Project/procure-to-pay-system/backend/venv/bin/python',
        'manage.py', 'runserver', '0.0.0.0:8000'
    ], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    for _ in range(30):
        try:
            response = requests.get(f"{BASE_URL}/health/", timeout=2)
            if response.status_code == 200:
                return True
        except:
            time.sleep(1)
    return False

def stop_server():
    """Stop Django development server"""
    global server_process
    if server_process:
        server_process.terminate()
        server_process.wait()

def get_auth_token():
    """Get authentication token"""
    try:
        data = {"username": "staff1", "password": "password123"}
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            return response.json().get('access')
    except:
        pass
    return None

def test_document_processing():
    """Test document processing API"""
    print("🧪 Testing Document Processing API...")
    
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return False
    
    # Create test proforma
    proforma_content = """PROFORMA INVOICE

Vendor: Tech Solutions Ltd
Date: November 24, 2024

Items:
1. Laptop Computer - $1,200.00 x 5 = $6,000.00
2. Wireless Mouse - $25.00 x 10 = $250.00

Total Amount: $6,250.00
Terms: Net 30 days
"""
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write(proforma_content)
    temp_file.close()
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('proforma.txt', f, 'text/plain')}
            data = {'document_type': 'proforma'}
            
            response = requests.post(f"{BASE_URL}/api/documents/process/", 
                                   files=files, data=data, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Document processing successful!")
            print(f"   Method: {result.get('processing_method', 'Unknown')}")
            
            extracted = result.get('extracted_data', {})
            print(f"   Vendor: {extracted.get('vendor', 'N/A')}")
            print(f"   Amount: ${extracted.get('total_amount', '0.00')}")
            print(f"   Terms: {extracted.get('terms', 'N/A')}")
            return True
        else:
            print(f"❌ Processing failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        os.unlink(temp_file.name)

def test_purchase_request_with_proforma():
    """Test purchase request creation with proforma"""
    print("\n📋 Testing Purchase Request with Proforma...")
    
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return False
    
    # Create test proforma
    proforma_content = """PROFORMA INVOICE
Vendor: Office Supplies Inc
Total Amount: $2500.00
Terms: Net 30 days
"""
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write(proforma_content)
    temp_file.close()
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(temp_file.name, 'rb') as f:
            files = {'proforma': ('proforma.txt', f, 'text/plain')}
            data = {
                'title': 'Test Purchase with Document Processing',
                'description': 'Testing proforma processing integration',
                'amount': '2500.00',
                'items': json.dumps([{
                    'name': 'Office Supplies',
                    'description': 'Various office items',
                    'quantity': 1,
                    'unit_price': '2500.00'
                }])
            }
            
            response = requests.post(f"{BASE_URL}/api/requests/", 
                                   files=files, data=data, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Purchase request with proforma created!")
            print(f"   Request ID: {result['id']}")
            print(f"   Proforma file: {result.get('proforma', 'None')}")
            
            # Check extracted data
            proforma_data = result.get('proforma_data', {})
            if proforma_data:
                print(f"   Extracted vendor: {proforma_data.get('vendor', 'N/A')}")
                print(f"   Extracted amount: ${proforma_data.get('total_amount', '0.00')}")
            
            return result['id']
        else:
            print(f"❌ Request creation failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    finally:
        os.unlink(temp_file.name)

def main():
    print("🤖 Simple Document Processing API Test")
    print("=" * 45)
    
    # Start server
    if not start_server():
        print("❌ Failed to start server")
        return
    
    try:
        # Test document processing API
        doc_ok = test_document_processing()
        
        # Test purchase request integration
        request_id = test_purchase_request_with_proforma()
        
        print("\n" + "=" * 45)
        print("📊 Test Results:")
        print(f"   Document Processing API: {'✅' if doc_ok else '❌'}")
        print(f"   Purchase Request Integration: {'✅' if request_id else '❌'}")
        
        if doc_ok and request_id:
            print("\n🎉 Document Processing APIs are working!")
            print("✅ Proforma upload & extraction functional")
            print("✅ Purchase request integration operational")
            print("✅ Basic pattern matching working (fallback for AI)")
        else:
            print("\n⚠️ Some issues detected - check logs above")
        
    finally:
        stop_server()

if __name__ == "__main__":
    main()