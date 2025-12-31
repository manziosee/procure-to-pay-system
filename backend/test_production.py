#!/usr/bin/env python3
"""
Test production deployment
Usage: python test_production.py <base-url>
Example: python test_production.py https://your-app.onrender.com
"""
import sys
import requests

def test_deployment(base_url):
    """Test key endpoints after deployment"""
    print(f"🧪 Testing deployment at: {base_url}")
    
    endpoints = [
        ("/health/", "Health Check"),
        ("/api/docs/", "Swagger UI"),
        ("/api/redoc/", "ReDoc"),
        ("/api/schema/", "OpenAPI Schema"),
        ("/api/auth/login/", "Login Endpoint"),
    ]
    
    for endpoint, name in endpoints:
        try:
            url = f"{base_url.rstrip('/')}{endpoint}"
            response = requests.get(url, timeout=10)
            status = "✅" if response.status_code in [200, 405] else "❌"
            print(f"{status} {name}: {response.status_code} - {url}")
        except Exception as e:
            print(f"❌ {name}: ERROR - {e}")
    
    # Test authentication
    try:
        login_url = f"{base_url.rstrip('/')}/api/auth/login/"
        login_data = {"email": "staff1@example.com", "password": "password123"}
        response = requests.post(login_url, json=login_data, timeout=10)
        
        if response.status_code == 200:
            print("✅ Authentication: Login successful")
            token = response.json().get('access')
            
            # Test authenticated endpoint
            headers = {"Authorization": f"Bearer {token}"}
            profile_url = f"{base_url.rstrip('/')}/api/auth/profile/"
            profile_response = requests.get(profile_url, headers=headers, timeout=10)
            
            if profile_response.status_code == 200:
                print("✅ Authorization: Profile access successful")
            else:
                print(f"❌ Authorization: Profile access failed ({profile_response.status_code})")
        else:
            print(f"❌ Authentication: Login failed ({response.status_code})")
    except Exception as e:
        print(f"❌ Authentication: ERROR - {e}")
    
    print("\n🎉 Deployment test completed!")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_production.py <base-url>")
        print("Example: python test_production.py https://your-app.onrender.com")
        sys.exit(1)
    
    base_url = sys.argv[1]
    test_deployment(base_url)