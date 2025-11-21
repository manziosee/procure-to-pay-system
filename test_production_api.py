#!/usr/bin/env python3
"""
Production API Test Script for Procure-to-Pay System
Tests the live deployed API on Fly.io
"""

import requests
import json
import sys

BASE_URL = "https://procure-to-pay-backend.fly.dev/api"

def test_production_health():
    """Test production health endpoint"""
    print("🔍 Testing Production Health...")
    
    try:
        response = requests.get("https://procure-to-pay-backend.fly.dev/health/", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health Check: {health_data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_production_authentication():
    """Test production authentication"""
    print("🔐 Testing Production Authentication...")
    
    login_data = {
        "username": "staff1",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data, timeout=10)
        
        if response.status_code == 200:
            token = response.json()["access"]
            print("✅ Production login successful")
            return token
        else:
            print(f"❌ Production login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Production login error: {e}")
        return None

def test_production_api_endpoints(token):
    """Test production API endpoints"""
    print("📋 Testing Production API Endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("/auth/profile/", "User Profile"),
        ("/requests/", "Purchase Requests"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                print(f"✅ {description}: Working")
            else:
                print(f"❌ {description}: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ {description}: Error - {e}")

def test_production_swagger():
    """Test production Swagger documentation"""
    print("📚 Testing Production Swagger...")
    
    try:
        response = requests.get("https://procure-to-pay-backend.fly.dev/swagger/", timeout=10)
        
        if response.status_code == 200:
            print("✅ Swagger documentation accessible")
            return True
        else:
            print(f"❌ Swagger failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Swagger error: {e}")
        return False

def run_production_tests():
    """Run all production tests"""
    print("🚀 Testing Production Deployment: https://procure-to-pay-backend.fly.dev/\n")
    
    # Test health
    if not test_production_health():
        print("❌ Production health check failed. Deployment may be down.")
        return False
    
    print()
    
    # Test authentication
    token = test_production_authentication()
    if not token:
        print("❌ Production authentication failed.")
        return False
    
    print()
    
    # Test API endpoints
    test_production_api_endpoints(token)
    
    print()
    
    # Test Swagger
    test_production_swagger()
    
    print()
    print("🎉 Production API Tests Completed!")
    print("🌐 Backend: https://procure-to-pay-backend.fly.dev/")
    print("📚 Swagger: https://procure-to-pay-backend.fly.dev/swagger/")
    print("🔍 Health: https://procure-to-pay-backend.fly.dev/health/")
    
    return True

if __name__ == "__main__":
    try:
        run_production_tests()
    except KeyboardInterrupt:
        print("\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        sys.exit(1)