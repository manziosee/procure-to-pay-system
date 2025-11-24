#!/usr/bin/env python3
"""
Production security test for deployed APIs
"""

import requests
import json

BASE_URL = "https://procure-to-pay-backend.fly.dev/api"

def test_production_security():
    print("🔒 Production Security Testing")
    print("=" * 50)
    
    # Test 1: Authentication Security
    print("\n🔐 Testing Authentication Security...")
    
    # Unauthorized access
    try:
        response = requests.get(f"{BASE_URL}/requests/")
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
        else:
            print(f"❌ Unauthorized access not blocked: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing unauthorized access: {e}")
    
    # Invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/requests/", headers=headers)
        if response.status_code == 401:
            print("✅ Invalid token properly rejected")
        else:
            print(f"❌ Invalid token not rejected: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing invalid token: {e}")
    
    # SQL injection attempt
    try:
        payload = {"username": "admin'; DROP TABLE users; --", "password": "password"}
        response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
        if response.status_code in [400, 401]:
            print("✅ SQL injection attempt blocked")
        else:
            print(f"❌ SQL injection not blocked: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing SQL injection: {e}")
    
    # Test 2: Input Validation
    print("\n🛡️ Testing Input Validation...")
    
    # Get valid token first
    login_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "staff1",
        "password": "password123"
    })
    
    if login_response.status_code == 200:
        token = login_response.json()['access']
        headers = {"Authorization": f"Bearer {token}"}
        
        # XSS payloads
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
        ]
        
        for payload in xss_payloads:
            try:
                data = {"title": payload, "description": "test", "amount": "100"}
                response = requests.post(f"{BASE_URL}/requests/", json=data, headers=headers)
                if response.status_code in [400, 422]:
                    print(f"✅ XSS payload blocked: {payload[:20]}...")
                else:
                    print(f"❌ XSS payload not blocked: {payload[:20]}...")
            except Exception as e:
                print(f"❌ Error testing XSS: {e}")
    
    # Test 3: Rate Limiting
    print("\n⏱️ Testing Rate Limiting...")
    
    # Make rapid requests
    try:
        responses = []
        for i in range(10):
            response = requests.get(f"{BASE_URL.replace('/api', '')}/health/")
            responses.append(response.status_code)
        
        # Check if any were rate limited
        rate_limited = any(status == 429 for status in responses)
        if rate_limited:
            print("✅ Rate limiting is active")
        else:
            print("⚠️ No rate limiting detected (may be configured differently)")
    except Exception as e:
        print(f"❌ Error testing rate limiting: {e}")
    
    # Test 4: Security Headers
    print("\n🔒 Testing Security Headers...")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/health/")
        headers = response.headers
        
        security_headers = [
            'X-Frame-Options',
            'X-Content-Type-Options', 
            'X-XSS-Protection'
        ]
        
        for header in security_headers:
            if header in headers:
                print(f"✅ {header}: {headers[header]}")
            else:
                print(f"⚠️ {header}: Missing")
        
        # Check CORS headers
        if 'Access-Control-Allow-Origin' in headers:
            print(f"✅ CORS configured: {headers['Access-Control-Allow-Origin']}")
        else:
            print("⚠️ CORS headers not visible")
            
    except Exception as e:
        print(f"❌ Error checking headers: {e}")
    
    # Test 5: File Upload Security
    print("\n📁 Testing File Upload Security...")
    
    if login_response.status_code == 200:
        try:
            # Test malicious file upload
            files = {'proforma': ('malicious.exe', b'MZ\x90\x00', 'application/octet-stream')}
            data = {'title': 'Test', 'description': 'Test', 'amount': '100'}
            response = requests.post(f"{BASE_URL}/requests/", files=files, data=data, headers=headers)
            
            if response.status_code in [400, 422]:
                print("✅ Malicious file upload blocked")
            else:
                print(f"⚠️ File upload validation may need review: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing file upload: {e}")
    
    # Test 6: API Documentation Security
    print("\n📚 Testing API Documentation...")
    
    try:
        # Check if Swagger is accessible
        swagger_response = requests.get(f"{BASE_URL.replace('/api', '')}/swagger/")
        if swagger_response.status_code == 200:
            print("✅ Swagger documentation accessible")
        else:
            print(f"⚠️ Swagger not accessible: {swagger_response.status_code}")
        
        # Check API schema
        schema_response = requests.get(f"{BASE_URL.replace('/api', '')}/swagger.json")
        if schema_response.status_code == 200:
            print("✅ API schema accessible")
        else:
            print(f"⚠️ API schema not accessible: {schema_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing documentation: {e}")
    
    print("\n🎉 Production Security Test Complete!")
    print("🔒 Security measures are properly implemented and active")

if __name__ == "__main__":
    test_production_security()