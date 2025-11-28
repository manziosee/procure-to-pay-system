#!/usr/bin/env python3
"""
Test document download functionality
"""
import requests

BASE_URL = "https://procure-to-pay-system-xnwp.onrender.com/api"

def test_download():
    print("🔍 Testing Document Download")
    print("=" * 50)
    
    # Login as finance user
    login_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "finance1@example.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token = login_response.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # Get requests
    requests_response = requests.get(f"{BASE_URL}/requests/", headers=headers)
    if requests_response.status_code != 200:
        print(f"❌ Failed to get requests: {requests_response.status_code}")
        return
    
    requests_data = requests_response.json()
    if not requests_data.get('results'):
        print("❌ No requests found")
        return
    
    request_id = requests_data['results'][0]['id']
    print(f"✅ Found request ID: {request_id}")
    
    # Test download endpoints
    for doc_type in ['proforma', 'purchase_order', 'receipt']:
        print(f"\n📄 Testing {doc_type} download...")
        download_response = requests.get(
            f"{BASE_URL}/requests/{request_id}/download/{doc_type}/",
            headers=headers
        )
        
        print(f"Status: {download_response.status_code}")
        if download_response.status_code == 200:
            print(f"✅ {doc_type} download successful")
            print(f"Content-Type: {download_response.headers.get('Content-Type')}")
            print(f"Content-Length: {len(download_response.content)} bytes")
        elif download_response.status_code == 404:
            print(f"⚠️ {doc_type} not found (expected for some documents)")
        else:
            print(f"❌ {doc_type} download failed")
            print(f"Response: {download_response.text}")

if __name__ == "__main__":
    test_download()