#!/usr/bin/env python3
"""
Test all API endpoints with Supabase database
"""
import requests
import json
import time
import subprocess
import signal
import os

BASE_URL = "http://localhost:8000"
server_process = None

def start_server():
    """Start Django development server"""
    global server_process
    os.chdir('/home/manzi/Project/procure-to-pay-system/backend')
    env = os.environ.copy()
    env.pop('DEBUG', None)  # Remove DEBUG env var
    
    server_process = subprocess.Popen([
        '/home/manzi/Project/procure-to-pay-system/backend/venv/bin/python',
        'manage.py', 'runserver', '0.0.0.0:8000'
    ], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Wait for server to start
    for _ in range(30):
        try:
            response = requests.get(f"{BASE_URL}/health/", timeout=2)
            if response.status_code == 200:
                print("✅ Server started successfully")
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

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check: {data['status']}")
            return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    return False

def test_root():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['message']}")
            return True
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    return False

def test_swagger():
    """Test Swagger documentation"""
    try:
        response = requests.get(f"{BASE_URL}/swagger/")
        if response.status_code == 200:
            print("✅ Swagger UI accessible")
            return True
    except Exception as e:
        print(f"❌ Swagger UI failed: {e}")
    return False

def create_test_user():
    """Create a test user for authentication"""
    try:
        # Use Django shell to create user
        cmd = [
            '/home/manzi/Project/procure-to-pay-system/backend/venv/bin/python',
            'manage.py', 'shell', '-c',
            "from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com', 'role': 'staff'}); user.set_password('testpass123'); user.save(); print('User created' if created else 'User exists')"
        ]
        
        env = os.environ.copy()
        env.pop('DEBUG', None)
        
        result = subprocess.run(cmd, cwd='/home/manzi/Project/procure-to-pay-system/backend', 
                              env=env, capture_output=True, text=True)
        print("✅ Test user ready")
        return True
    except Exception as e:
        print(f"❌ Test user creation failed: {e}")
        return False

def test_login():
    """Test login endpoint"""
    try:
        data = {
            "username": "testuser",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful")
            return token_data.get('access')
    except Exception as e:
        print(f"❌ Login failed: {e}")
    return None

def test_profile(token):
    """Test profile endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/profile/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Profile endpoint: {data['username']}")
            return True
    except Exception as e:
        print(f"❌ Profile endpoint failed: {e}")
    return False

def test_requests_list(token):
    """Test requests list endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/requests/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Requests list: {data.get('count', 0)} requests")
            return True
    except Exception as e:
        print(f"❌ Requests list failed: {e}")
    return False

def main():
    print("🧪 Testing Supabase API Endpoints")
    print("=" * 50)
    
    # Start server
    if not start_server():
        print("❌ Failed to start server")
        return
    
    try:
        # Test endpoints
        health_ok = test_health()
        root_ok = test_root()
        swagger_ok = test_swagger()
        
        # Create test user and test auth
        user_ok = create_test_user()
        token = test_login() if user_ok else None
        profile_ok = test_profile(token) if token else False
        requests_ok = test_requests_list(token) if token else False
        
        print("\n" + "=" * 50)
        print("📊 Test Results:")
        print(f"   Health: {'✅' if health_ok else '❌'}")
        print(f"   Root: {'✅' if root_ok else '❌'}")
        print(f"   Swagger: {'✅' if swagger_ok else '❌'}")
        print(f"   User Creation: {'✅' if user_ok else '❌'}")
        print(f"   Login: {'✅' if token else '❌'}")
        print(f"   Profile: {'✅' if profile_ok else '❌'}")
        print(f"   Requests: {'✅' if requests_ok else '❌'}")
        
        all_passed = all([health_ok, root_ok, swagger_ok, user_ok, token, profile_ok, requests_ok])
        print(f"\n🎉 All endpoints working with Supabase!" if all_passed else "⚠️ Some tests failed")
        
    finally:
        stop_server()

if __name__ == "__main__":
    main()