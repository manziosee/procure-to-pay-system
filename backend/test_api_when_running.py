#!/usr/bin/env python3
"""
API Test Script - Run this when the Django server is running
Usage: python3 test_api_when_running.py
"""

import requests
import json
import tempfile
import os

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("🚀 Testing Procure-to-Pay API")
    print("=" * 50)
    
    # Test 1: Health Check
    print("1️⃣ Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print("   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return
    
    # Test 2: Root Endpoint
    print("\n2️⃣ Root Endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Root endpoint working")
    
    # Test 3: ReDoc Documentation
    print("\n3️⃣ ReDoc Documentation...")
    response = requests.get(f"{BASE_URL}/redoc/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ ReDoc UI accessible")
    
    # Test 4: User Registration
    print("\n4️⃣ User Registration...")
    data = {
        "username": "testuser456",
        "email": "testuser456@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "staff",
        "department": "IT",
        "password": "testpass123",
        "password_confirm": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/register/", json=data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        print("   ✅ Registration successful")
    elif response.status_code == 400:
        print("   ⚠️ User might already exist")
    
    # Test 5: User Login
    print("\n5️⃣ User Login...")
    login_data = {
        "email": "testuser456@example.com",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        access_token = result.get("access")
        print("   ✅ Login successful")
        
        # Test 6: User Profile
        print("\n6️⃣ User Profile...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/profile/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Profile access successful")
        
        # Test 7: Create Purchase Request
        print("\n7️⃣ Create Purchase Request...")
        request_data = {
            "title": "Test API Request",
            "description": "Testing API functionality",
            "amount": "500.00",
            "items": [
                {
                    "name": "Test Item",
                    "quantity": 1,
                    "unit_price": "500.00",
                    "total_price": "500.00"
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/requests/", json=request_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            print("   ✅ Request creation successful")
        
        # Test 8: List Requests
        print("\n8️⃣ List Purchase Requests...")
        response = requests.get(f"{BASE_URL}/api/requests/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Request listing successful")
        
        # Test 9: Document Processing
        print("\n9️⃣ Document Processing...")
        test_content = "PROFORMA INVOICE\\nVendor: Test Company\\nTotal: $100.00"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file = f.name
        
        try:
            with open(temp_file, 'rb') as f:
                files = {'file': f}
                data = {'document_type': 'proforma'}
                response = requests.post(f"{BASE_URL}/api/documents/process/", 
                                       files=files, data=data, headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Document processing successful")
        finally:
            os.unlink(temp_file)
    
    else:
        print("   ❌ Login failed - skipping authenticated tests")
    
    print("\n" + "=" * 50)
    print("🎯 API Test Summary:")
    print("   • Health check endpoint")
    print("   • Root API endpoint")
    print("   • ReDoc documentation")
    print("   • User registration")
    print("   • Email-based login")
    print("   • JWT authentication")
    print("   • User profile access")
    print("   • Purchase request creation")
    print("   • Request listing")
    print("   • Document processing")
    print("\n📝 To run full tests:")
    print("   1. Start Django server: python manage.py runserver")
    print("   2. Run this script: python3 test_api_when_running.py")

if __name__ == "__main__":
    test_api()