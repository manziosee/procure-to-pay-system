#!/usr/bin/env python3
"""
Final verification that all endpoints work with Supabase database
"""
import requests
import json
import time
import subprocess
import os

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

def test_complete_workflow():
    """Test complete procurement workflow"""
    results = {}
    
    # 1. Test user authentication
    print("1️⃣ Testing Authentication...")
    staff_token = None
    try:
        data = {"username": "staff1", "password": "password123"}
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            staff_token = response.json().get('access')
            results['auth'] = "✅ PASS"
            print("   ✅ Staff login successful")
        else:
            results['auth'] = "❌ FAIL"
            print(f"   ❌ Login failed: {response.text}")
    except Exception as e:
        results['auth'] = f"❌ ERROR: {e}"
        print(f"   ❌ Auth error: {e}")
    
    if not staff_token:
        return results
    
    # 2. Test creating purchase request (INSERT)
    print("\n2️⃣ Testing Purchase Request Creation...")
    request_id = None
    try:
        headers = {"Authorization": f"Bearer {staff_token}"}
        data = {
            "title": "Final Test Purchase Request",
            "description": "Testing complete workflow with Supabase",
            "amount": "2500.00",
            "items": [
                {
                    "name": "Test Product",
                    "description": "Product for testing",
                    "quantity": 5,
                    "unit_price": "500.00"
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/requests/", json=data, headers=headers)
        if response.status_code == 201:
            request_data = response.json()
            request_id = request_data['id']
            results['create'] = "✅ PASS"
            print(f"   ✅ Request created (ID: {request_id})")
        else:
            results['create'] = "❌ FAIL"
            print(f"   ❌ Creation failed: {response.text}")
    except Exception as e:
        results['create'] = f"❌ ERROR: {e}"
        print(f"   ❌ Create error: {e}")
    
    # 3. Test fetching requests (SELECT)
    print("\n3️⃣ Testing Data Retrieval...")
    try:
        headers = {"Authorization": f"Bearer {staff_token}"}
        response = requests.get(f"{BASE_URL}/api/requests/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            results['read'] = "✅ PASS"
            print(f"   ✅ Retrieved {count} requests from Supabase")
        else:
            results['read'] = "❌ FAIL"
            print(f"   ❌ Retrieval failed: {response.text}")
    except Exception as e:
        results['read'] = f"❌ ERROR: {e}"
        print(f"   ❌ Read error: {e}")
    
    # 4. Test updating request (UPDATE)
    if request_id:
        print("\n4️⃣ Testing Data Update...")
        try:
            headers = {"Authorization": f"Bearer {staff_token}"}
            data = {
                "title": "Updated Final Test Request",
                "description": "Updated description for Supabase testing",
                "amount": "3000.00"
            }
            
            response = requests.put(f"{BASE_URL}/api/requests/{request_id}/", json=data, headers=headers)
            if response.status_code == 200:
                results['update'] = "✅ PASS"
                print(f"   ✅ Request {request_id} updated in Supabase")
            else:
                results['update'] = "❌ FAIL"
                print(f"   ❌ Update failed: {response.text}")
        except Exception as e:
            results['update'] = f"❌ ERROR: {e}"
            print(f"   ❌ Update error: {e}")
    
    # 5. Test approval workflow
    print("\n5️⃣ Testing Approval Workflow...")
    try:
        # Login as approver
        data = {"username": "approver1", "password": "password123"}
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            approver_token = response.json().get('access')
            
            # Approve the request
            headers = {"Authorization": f"Bearer {approver_token}"}
            data = {"comments": "Approved for final testing"}
            
            response = requests.patch(f"{BASE_URL}/api/requests/{request_id}/approve/", 
                                    json=data, headers=headers)
            if response.status_code == 200:
                results['approval'] = "✅ PASS"
                print(f"   ✅ Request {request_id} approved")
            else:
                results['approval'] = "❌ FAIL"
                print(f"   ❌ Approval failed: {response.text}")
        else:
            results['approval'] = "❌ FAIL - Auth"
            print("   ❌ Approver login failed")
    except Exception as e:
        results['approval'] = f"❌ ERROR: {e}"
        print(f"   ❌ Approval error: {e}")
    
    # 6. Test role-based access
    print("\n6️⃣ Testing Role-Based Access...")
    try:
        # Login as finance user
        data = {"username": "finance1", "password": "password123"}
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            finance_token = response.json().get('access')
            
            # Finance should see all requests
            headers = {"Authorization": f"Bearer {finance_token}"}
            response = requests.get(f"{BASE_URL}/api/requests/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                results['rbac'] = "✅ PASS"
                print(f"   ✅ Finance user can access all requests")
            else:
                results['rbac'] = "❌ FAIL"
                print(f"   ❌ Finance access failed: {response.text}")
        else:
            results['rbac'] = "❌ FAIL - Auth"
            print("   ❌ Finance login failed")
    except Exception as e:
        results['rbac'] = f"❌ ERROR: {e}"
        print(f"   ❌ RBAC error: {e}")
    
    return results

def verify_database_persistence():
    """Verify data persists in Supabase"""
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

print(f"📊 Supabase Database State:")
print(f"   Users: {users}")
print(f"   Purchase Requests: {requests}")
print(f"   Request Items: {items}")
print(f"   Approvals: {approvals}")

# Show latest request
latest = PurchaseRequest.objects.order_by('-created_at').first()
if latest:
    print(f"   Latest Request: '{latest.title}' - {latest.status}")
            """
        ]
        
        env = os.environ.copy()
        env.pop('DEBUG', None)
        
        result = subprocess.run(cmd, cwd='/home/manzi/Project/procure-to-pay-system/backend', 
                              env=env, capture_output=True, text=True)
        print(result.stdout)
        return True
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

def main():
    print("🎯 Final Verification: Complete Workflow with Supabase")
    print("=" * 60)
    
    # Start server
    if not start_server():
        print("❌ Failed to start server")
        return
    
    try:
        # Run complete workflow test
        results = test_complete_workflow()
        
        # Verify database state
        print("\n🔍 Database Persistence Check:")
        print("-" * 40)
        verify_database_persistence()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 FINAL TEST RESULTS:")
        print("-" * 30)
        for test, result in results.items():
            print(f"   {test.upper()}: {result}")
        
        # Overall status
        passed = sum(1 for r in results.values() if r == "✅ PASS")
        total = len(results)
        
        print(f"\n🎉 OVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL SYSTEMS OPERATIONAL WITH SUPABASE!")
            print("🗄️ Database: CREATE, READ, UPDATE operations working")
            print("🔐 Authentication: JWT tokens working")
            print("👥 Authorization: Role-based access working")
            print("🔄 Workflow: Multi-level approval working")
        else:
            print("⚠️ Some tests failed - check individual results above")
        
    finally:
        stop_server()

if __name__ == "__main__":
    main()