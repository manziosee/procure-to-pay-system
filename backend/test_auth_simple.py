#!/usr/bin/env python3
"""
Simple authentication test
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auth():
    print("🔄 Testing Authentication...")
    
    # Test registration
    print("1. Testing Registration...")
    reg_data = {
        "username": "testuser789",
        "email": "testuser789@example.com", 
        "first_name": "Test",
        "last_name": "User",
        "role": "staff",
        "department": "IT",
        "password": "testpass123",
        "password_confirm": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register/", json=reg_data)
    print(f"   Registration Status: {response.status_code}")
    if response.status_code != 201:
        print(f"   Error: {response.text}")
    else:
        print("   ✅ Registration successful")
    
    # Test login
    print("\n2. Testing Login...")
    login_data = {
        "email": "testuser789@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
    print(f"   Login Status: {response.status_code}")
    if response.status_code != 200:
        print(f"   Error: {response.text}")
    else:
        result = response.json()
        print("   ✅ Login successful")
        print(f"   Access token received: {bool(result.get('access'))}")
        
        # Test profile
        print("\n3. Testing Profile...")
        headers = {"Authorization": f"Bearer {result['access']}"}
        response = requests.get(f"{BASE_URL}/api/auth/profile/", headers=headers)
        print(f"   Profile Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Profile access successful")
        else:
            print(f"   Error: {response.text}")

if __name__ == "__main__":
    test_auth()