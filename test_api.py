#!/usr/bin/env python3
"""
API Test Script for Procure-to-Pay System
Run this script to test all API endpoints
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api"  # Local development
# BASE_URL = "https://procure-to-pay-backend.fly.dev/api"  # Production

def test_authentication():
    """Test user authentication"""
    print("🔐 Testing Authentication...")
    
    # Test login
    login_data = {
        "username": "staff1",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if response.status_code == 200:
        token = response.json()["access"]
        print("✅ Login successful")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_profile(token):
    """Test user profile endpoint"""
    print("👤 Testing User Profile...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        print(f"✅ Profile retrieved: {profile['username']} ({profile['role']})")
        return True
    else:
        print(f"❌ Profile retrieval failed: {response.status_code}")
        return False

def test_create_request(token):
    """Test creating a purchase request"""
    print("📝 Testing Create Request...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    request_data = {
        "title": "Test Office Supplies",
        "description": "Testing API request creation",
        "amount": "500.00"
    }
    
    response = requests.post(f"{BASE_URL}/requests/", headers=headers, data=request_data)
    
    if response.status_code == 201:
        request_id = response.json()["id"]
        print(f"✅ Request created with ID: {request_id}")
        return request_id
    else:
        print(f"❌ Request creation failed: {response.status_code}")
        print(response.text)
        return None

def test_list_requests(token):
    """Test listing requests"""
    print("📋 Testing List Requests...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/requests/", headers=headers)
    
    if response.status_code == 200:
        requests_data = response.json()
        count = requests_data.get("count", len(requests_data))
        print(f"✅ Retrieved {count} requests")
        return True
    else:
        print(f"❌ List requests failed: {response.status_code}")
        return False

def test_approval_workflow():
    """Test the approval workflow"""
    print("✅ Testing Approval Workflow...")
    
    # Login as approver level 1
    login_data = {"username": "approver1", "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if response.status_code != 200:
        print("❌ Approver login failed")
        return False
    
    approver_token = response.json()["access"]
    headers = {"Authorization": f"Bearer {approver_token}"}
    
    # Get pending requests
    response = requests.get(f"{BASE_URL}/requests/", headers=headers)
    
    if response.status_code == 200 and response.json().get("results"):
        request_id = response.json()["results"][0]["id"]
        
        # Approve the request
        approval_data = {"comments": "Approved by Level 1"}
        response = requests.patch(
            f"{BASE_URL}/requests/{request_id}/approve/", 
            headers=headers, 
            json=approval_data
        )
        
        if response.status_code == 200:
            print("✅ Level 1 approval successful")
            return request_id
        else:
            print(f"❌ Approval failed: {response.status_code}")
    
    return None

def test_document_processing(token):
    """Test document processing endpoint"""
    print("🤖 Testing Document Processing...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a simple test file
    test_content = "PROFORMA INVOICE\nVendor: Test Supplier\nTotal: $500.00\nItems: Office Supplies"
    
    files = {
        'document': ('test_proforma.txt', test_content, 'text/plain'),
        'type': (None, 'proforma')
    }
    
    response = requests.post(f"{BASE_URL}/documents/process/", headers=headers, files=files)
    
    if response.status_code == 200:
        extracted_data = response.json()["extracted_data"]
        print(f"✅ Document processed: {extracted_data}")
        return True
    else:
        print(f"❌ Document processing failed: {response.status_code}")
        return False

def run_all_tests():
    """Run all API tests"""
    print("🚀 Starting API Tests for Procure-to-Pay System\n")
    
    # Test authentication
    token = test_authentication()
    if not token:
        print("❌ Authentication failed. Cannot continue tests.")
        return False
    
    print()
    
    # Test profile
    test_profile(token)
    print()
    
    # Test create request
    request_id = test_create_request(token)
    print()
    
    # Test list requests
    test_list_requests(token)
    print()
    
    # Test approval workflow
    if request_id:
        test_approval_workflow()
        print()
    
    # Test document processing
    test_document_processing(token)
    print()
    
    print("🎉 API Tests Completed!")
    return True

if __name__ == "__main__":
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure it's running on http://localhost:8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        sys.exit(1)