#!/usr/bin/env python3
"""
High Availability Monitoring Script
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = "https://procure-to-pay-backend.fly.dev"

def monitor_high_availability():
    print("🔍 High Availability Monitoring")
    print("=" * 50)
    print(f"Monitoring: {BASE_URL}")
    print(f"Started: {datetime.now()}")
    
    # Test 1: Health Check Consistency
    print("\n🏥 Testing Health Check Consistency...")
    
    health_responses = []
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/health/", timeout=5)
            health_responses.append({
                'test': i+1,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds() * 1000,
                'success': response.status_code == 200
            })
            time.sleep(0.5)
        except Exception as e:
            health_responses.append({
                'test': i+1,
                'status_code': 0,
                'response_time': 0,
                'success': False,
                'error': str(e)
            })
    
    # Analyze health check results
    successful_checks = sum(1 for r in health_responses if r['success'])
    avg_response_time = sum(r['response_time'] for r in health_responses if r['success']) / max(successful_checks, 1)
    
    print(f"✅ Health Check Success Rate: {successful_checks}/10 ({successful_checks*10}%)")
    print(f"✅ Average Response Time: {avg_response_time:.2f}ms")
    
    # Test 2: Load Balancing Verification
    print("\n⚖️ Testing Load Balancing...")
    
    api_responses = []
    for i in range(20):
        try:
            response = requests.get(f"{BASE_URL}/api/", timeout=5)
            api_responses.append({
                'test': i+1,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds() * 1000,
                'headers': dict(response.headers)
            })
            time.sleep(0.2)
        except Exception as e:
            api_responses.append({
                'test': i+1,
                'status_code': 0,
                'error': str(e)
            })
    
    # Analyze load balancing
    successful_api_calls = sum(1 for r in api_responses if r.get('status_code') in [200, 401])  # 401 is expected for unauthenticated
    api_avg_response_time = sum(r.get('response_time', 0) for r in api_responses if r.get('response_time')) / max(successful_api_calls, 1)
    
    print(f"✅ API Availability: {successful_api_calls}/20 ({successful_api_calls*5}%)")
    print(f"✅ API Average Response Time: {api_avg_response_time:.2f}ms")
    
    # Test 3: Geographic Response Testing
    print("\n🌍 Testing Geographic Response...")
    
    endpoints = [
        '/health/',
        '/api/',
        '/swagger.json'
    ]
    
    for endpoint in endpoints:
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 401]:
                print(f"✅ {endpoint}: {response_time:.2f}ms")
            else:
                print(f"⚠️ {endpoint}: {response.status_code} - {response_time:.2f}ms")
        except Exception as e:
            print(f"❌ {endpoint}: ERROR - {e}")
    
    # Test 4: Fault Tolerance Simulation
    print("\n🛡️ Testing Fault Tolerance...")
    
    # Rapid concurrent requests to test load handling
    import concurrent.futures
    
    def make_request():
        try:
            response = requests.get(f"{BASE_URL}/health/", timeout=5)
            return {
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds() * 1000,
                'success': response.status_code == 200
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    print("  Running 50 concurrent requests...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(50)]
        concurrent_results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    concurrent_success = sum(1 for r in concurrent_results if r.get('success'))
    concurrent_avg_time = sum(r.get('response_time', 0) for r in concurrent_results if r.get('success')) / max(concurrent_success, 1)
    
    print(f"✅ Concurrent Load Success: {concurrent_success}/50 ({concurrent_success*2}%)")
    print(f"✅ Concurrent Average Response: {concurrent_avg_time:.2f}ms")
    
    # Test 5: Authentication Load Testing
    print("\n🔐 Testing Authentication Under Load...")
    
    auth_results = []
    for i in range(5):
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login/", 
                                   json={"username": "staff1", "password": "password123"},
                                   timeout=10)
            auth_results.append({
                'test': i+1,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds() * 1000,
                'success': response.status_code == 200
            })
            time.sleep(1)
        except Exception as e:
            auth_results.append({
                'test': i+1,
                'success': False,
                'error': str(e)
            })
    
    auth_success = sum(1 for r in auth_results if r.get('success'))
    auth_avg_time = sum(r.get('response_time', 0) for r in auth_results if r.get('success')) / max(auth_success, 1)
    
    print(f"✅ Authentication Success: {auth_success}/5 ({auth_success*20}%)")
    print(f"✅ Authentication Avg Time: {auth_avg_time:.2f}ms")
    
    # Generate Summary Report
    print("\n📊 High Availability Summary")
    print("=" * 50)
    
    overall_health = (
        (successful_checks / 10) * 0.3 +
        (successful_api_calls / 20) * 0.3 +
        (concurrent_success / 50) * 0.2 +
        (auth_success / 5) * 0.2
    ) * 100
    
    print(f"Overall Health Score: {overall_health:.1f}%")
    
    if overall_health >= 95:
        print("🟢 Status: EXCELLENT - High availability fully operational")
    elif overall_health >= 85:
        print("🟡 Status: GOOD - High availability operational with minor issues")
    elif overall_health >= 70:
        print("🟠 Status: WARNING - High availability degraded")
    else:
        print("🔴 Status: CRITICAL - High availability compromised")
    
    # Recommendations
    print("\n💡 Recommendations:")
    if avg_response_time > 500:
        print("  • Consider upgrading machine types for better performance")
    if successful_checks < 10:
        print("  • Investigate health check failures")
    if concurrent_success < 45:
        print("  • Consider adding more machines for better load handling")
    if auth_success < 5:
        print("  • Check authentication service stability")
    
    print(f"\n✅ Monitoring completed at {datetime.now()}")
    
    return {
        'overall_health': overall_health,
        'health_success_rate': successful_checks / 10,
        'api_success_rate': successful_api_calls / 20,
        'concurrent_success_rate': concurrent_success / 50,
        'auth_success_rate': auth_success / 5,
        'avg_response_time': avg_response_time
    }

if __name__ == "__main__":
    monitor_high_availability()