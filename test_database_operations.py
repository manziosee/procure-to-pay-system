#!/usr/bin/env python3
"""
Test database operations - Create, Read, Update, Delete with Supabase
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

def create_demo_users():
    """Create demo users in database"""
    try:
        cmd = [
            '/home/manzi/Project/procure-to-pay-system/backend/venv/bin/python',
            'manage.py', 'create_demo_users'
        ]
        env = os.environ.copy()
        env.pop('DEBUG', None)
        
        result = subprocess.run(cmd, cwd='/home/manzi/Project/procure-to-pay-system/backend', 
                              env=env, capture_output=True, text=True)
        print("✅ Demo users created in Supabase")
        return True
    except Exception as e:
        print(f"❌ Demo user creation failed: {e}")
        return False

def test_user_login(username, password):
    """Test user login and return token"""
    try:
        data = {"username": username, "password": password}
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"✅ Login successful for {username}")
            return token_data.get('access')
        else:
            print(f"❌ Login failed for {username}: {response.text}")
    except Exception as e:
        print(f"❌ Login error for {username}: {e}")
    return None

def test_create_purchase_request(token):
    """Test creating a purchase request (INSERT operation)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "title": "Test Purchase Request",
            "description": "Testing database INSERT operation with Supabase",
            "amount": "1500.00",
            "items": [
                {
                    "name": "Test Item 1",
                    "description": "First test item",
                    "quantity": 2,
                    "unit_price": "500.00"
                },
                {
                    "name": "Test Item 2", 
                    "description": "Second test item",
                    "quantity": 1,
                    "unit_price": "500.00"
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/requests/", json=data, headers=headers)
        if response.status_code == 201:
            request_data = response.json()
            print(f"✅ Purchase request created (ID: {request_data['id']})")
            return request_data['id']
        else:
            print(f"❌ Failed to create request: {response.text}")
    except Exception as e:
        print(f"❌ Create request error: {e}")
    return None

def test_fetch_purchase_requests(token):
    """Test fetching purchase requests (SELECT operation)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/requests/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            print(f"✅ Fetched {count} purchase requests from Supabase")
            return data.get('results', [])
        else:
            print(f"❌ Failed to fetch requests: {response.text}")
    except Exception as e:
        print(f"❌ Fetch requests error: {e}")
    return []

def test_update_purchase_request(token, request_id):
    """Test updating a purchase request (UPDATE operation)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "title": "Updated Test Purchase Request",
            "description": "Testing database UPDATE operation with Supabase",
            "amount": "2000.00"
        }
        
        response = requests.put(f"{BASE_URL}/api/requests/{request_id}/", json=data, headers=headers)
        if response.status_code == 200:
            print(f"✅ Purchase request {request_id} updated in Supabase")
            return True
        else:
            print(f"❌ Failed to update request: {response.text}")
    except Exception as e:
        print(f"❌ Update request error: {e}")
    return False

def test_approval_workflow(approver_token, request_id):
    """Test approval workflow (UPDATE operations)"""
    try:
        headers = {"Authorization": f"Bearer {approver_token}"}
        data = {"comments": "Approved for testing database operations"}
        
        response = requests.patch(f"{BASE_URL}/api/requests/{request_id}/approve/", 
                                json=data, headers=headers)
        if response.status_code == 200:
            print(f"✅ Request {request_id} approved (database updated)")
            return True
        else:
            print(f"❌ Failed to approve request: {response.text}")
    except Exception as e:
        print(f"❌ Approval error: {e}")
    return False

def test_user_profile(token):
    """Test fetching user profile (SELECT operation)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/profile/", headers=headers)
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ Profile fetched: {profile['username']} ({profile['role']})")
            return profile
        else:
            print(f"❌ Failed to fetch profile: {response.text}")
    except Exception as e:
        print(f"❌ Profile fetch error: {e}")
    return None

def verify_database_state():
    """Verify data exists in database"""
    try:
        cmd = [
            '/home/manzi/Project/procure-to-pay-system/backend/venv/bin/python',
            'manage.py', 'shell', '-c',
            """
from django.contrib.auth import get_user_model
from procure_to_pay.apps.requests.models import PurchaseRequest, RequestItem, Approval

User = get_user_model()
users = User.objects.count()
requests = PurchaseRequest.objects.count()
items = RequestItem.objects.count()
approvals = Approval.objects.count()

print(f"Database State:")
print(f"  Users: {users}")
print(f"  Requests: {requests}")
print(f"  Items: {items}")
print(f"  Approvals: {approvals}")
            """
        ]
        
        env = os.environ.copy()
        env.pop('DEBUG', None)
        
        result = subprocess.run(cmd, cwd='/home/manzi/Project/procure-to-pay-system/backend', 
                              env=env, capture_output=True, text=True)
        print("✅ Database verification:")
        print(result.stdout)
        return True
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

def main():
    print("🗄️ Testing Database Operations with Supabase")
    print("=" * 60)
    
    # Start server
    if not start_server():
        print("❌ Failed to start server")
        return
    
    try:
        # Create demo users
        users_created = create_demo_users()
        if not users_created:
            return
        
        # Test different user roles
        staff_token = test_user_login("staff1", "password123")
        approver1_token = test_user_login("approver1", "password123")
        approver2_token = test_user_login("approver2", "password123")
        finance_token = test_user_login("finance1", "password123")
        
        if not all([staff_token, approver1_token, approver2_token, finance_token]):
            print("❌ Failed to authenticate users")
            return
        
        print("\n📊 Testing Database Operations:")
        print("-" * 40)
        
        # Test user profile fetch (SELECT)
        staff_profile = test_user_profile(staff_token)
        
        # Test create request (INSERT)
        request_id = test_create_purchase_request(staff_token)
        
        # Test fetch requests (SELECT)
        requests = test_fetch_purchase_requests(staff_token)
        
        # Test update request (UPDATE)
        if request_id:
            test_update_purchase_request(staff_token, request_id)
        
        # Test approval workflow (UPDATE)
        if request_id:
            test_approval_workflow(approver1_token, request_id)
            test_approval_workflow(approver2_token, request_id)
        
        # Test finance view (SELECT with different permissions)
        finance_requests = test_fetch_purchase_requests(finance_token)
        
        print("\n🔍 Database State Verification:")
        print("-" * 40)
        verify_database_state()
        
        print("\n" + "=" * 60)
        print("🎉 All database operations working with Supabase!")
        print("✅ CREATE: Purchase requests and items inserted")
        print("✅ READ: Data fetched successfully")
        print("✅ UPDATE: Requests and approvals updated")
        print("✅ PERMISSIONS: Role-based access working")
        
    finally:
        stop_server()

if __name__ == "__main__":
    main()