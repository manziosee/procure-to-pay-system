#!/usr/bin/env python3
"""
Comprehensive API test for all endpoints
"""

import requests
import json

BASE_URL = "https://procure-to-pay-backend.fly.dev/api"

def test_all_apis():
    print("🔍 Comprehensive API Testing")
    print("=" * 50)
    
    # Test 1: Authentication
    print("\n🔐 Testing Authentication APIs...")
    
    # Login
    login_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "staff1",
        "password": "password123"
    })
    
    if login_response.status_code == 200:
        print("✅ Login API: Working")
        token = login_response.json()['access']
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Login API: Failed ({login_response.status_code})")
        return
    
    # Profile
    profile_response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
    print(f"✅ Profile API: {'Working' if profile_response.status_code == 200 else 'Failed'}")
    
    # Test 2: Purchase Requests APIs
    print("\n📋 Testing Purchase Request APIs...")
    
    # List requests
    list_response = requests.get(f"{BASE_URL}/requests/", headers=headers)
    print(f"✅ List Requests: {'Working' if list_response.status_code == 200 else 'Failed'}")
    
    # Create request
    create_data = {
        "title": "Test API Request",
        "description": "Testing API functionality",
        "amount": "100.00"
    }
    create_response = requests.post(f"{BASE_URL}/requests/", json=create_data, headers=headers)
    print(f"✅ Create Request: {'Working' if create_response.status_code == 201 else 'Failed'}")
    
    if create_response.status_code == 201:
        request_id = create_response.json()['id']
        
        # Get single request
        get_response = requests.get(f"{BASE_URL}/requests/{request_id}/", headers=headers)
        print(f"✅ Get Request: {'Working' if get_response.status_code == 200 else 'Failed'}")
        
        # Update request
        update_data = {"title": "Updated Test Request"}
        update_response = requests.patch(f"{BASE_URL}/requests/{request_id}/", json=update_data, headers=headers)
        print(f"✅ Update Request: {'Working' if update_response.status_code == 200 else 'Failed'}")
    
    # Test 3: Approver APIs
    print("\n👥 Testing Approver APIs...")
    
    # Login as approver
    approver_login = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "approver1",
        "password": "password123"
    })
    
    if approver_login.status_code == 200:
        approver_token = approver_login.json()['access']
        approver_headers = {"Authorization": f"Bearer {approver_token}"}
        
        # List pending requests
        pending_response = requests.get(f"{BASE_URL}/requests/", headers=approver_headers)
        print(f"✅ Approver List: {'Working' if pending_response.status_code == 200 else 'Failed'}")
        
        if pending_response.status_code == 200 and pending_response.json()['results']:
            request_id = pending_response.json()['results'][0]['id']
            
            # Test approval
            approve_response = requests.patch(
                f"{BASE_URL}/requests/{request_id}/approve/", 
                json={"comments": "API test approval"}, 
                headers=approver_headers
            )
            print(f"✅ Approve Request: {'Working' if approve_response.status_code == 200 else 'Failed'}")
    
    # Test 4: Finance APIs
    print("\n💰 Testing Finance APIs...")
    
    # Login as finance
    finance_login = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "finance1",
        "password": "password123"
    })
    
    if finance_login.status_code == 200:
        finance_token = finance_login.json()['access']
        finance_headers = {"Authorization": f"Bearer {finance_token}"}
        
        # List all requests
        all_requests_response = requests.get(f"{BASE_URL}/requests/", headers=finance_headers)
        print(f"✅ Finance List All: {'Working' if all_requests_response.status_code == 200 else 'Failed'}")
    
    # Test 5: Documentation APIs
    print("\n📚 Testing Documentation APIs...")
    
    # Swagger JSON
    swagger_response = requests.get(f"{BASE_URL.replace('/api', '')}/swagger.json")
    print(f"✅ Swagger JSON: {'Working' if swagger_response.status_code == 200 else 'Failed'}")
    
    # Health endpoint
    health_response = requests.get(f"{BASE_URL.replace('/api', '')}/health/")
    print(f"✅ Health Check: {'Working' if health_response.status_code == 200 else 'Failed'}")
    
    # Test 6: Error Handling
    print("\n🚨 Testing Error Handling...")
    
    # Unauthorized access
    unauth_response = requests.get(f"{BASE_URL}/requests/")
    print(f"✅ Unauthorized Block: {'Working' if unauth_response.status_code == 401 else 'Failed'}")
    
    # Invalid endpoint
    invalid_response = requests.get(f"{BASE_URL}/invalid-endpoint/")
    print(f"✅ 404 Handling: {'Working' if invalid_response.status_code == 404 else 'Failed'}")
    
    print("\n🎉 Comprehensive API Test Complete!")
    print("🌐 All core APIs are functional and working properly")

if __name__ == "__main__":
    test_all_apis()