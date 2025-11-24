#!/usr/bin/env python3
"""
Security audit script for the procure-to-pay system
"""

import os
import sys
import requests
import json
from datetime import datetime
import subprocess

class SecurityAuditor:
    def __init__(self):
        self.api_base = "http://localhost:8000/api"
        self.results = {}
        self.vulnerabilities = []
    
    def test_authentication_security(self):
        """Test authentication security"""
        print("🔐 Testing Authentication Security...")
        
        tests = []
        
        # Test 1: Unauthorized access
        try:
            response = requests.get(f"{self.api_base}/requests/")
            if response.status_code == 401:
                tests.append({"test": "Unauthorized access blocked", "status": "PASS"})
            else:
                tests.append({"test": "Unauthorized access blocked", "status": "FAIL", "details": f"Got {response.status_code}"})
        except Exception as e:
            tests.append({"test": "Unauthorized access blocked", "status": "ERROR", "details": str(e)})
        
        # Test 2: Invalid token
        try:
            headers = {"Authorization": "Bearer invalid_token"}
            response = requests.get(f"{self.api_base}/requests/", headers=headers)
            if response.status_code == 401:
                tests.append({"test": "Invalid token rejected", "status": "PASS"})
            else:
                tests.append({"test": "Invalid token rejected", "status": "FAIL", "details": f"Got {response.status_code}"})
        except Exception as e:
            tests.append({"test": "Invalid token rejected", "status": "ERROR", "details": str(e)})
        
        # Test 3: SQL injection in login
        try:
            payload = {"username": "admin'; DROP TABLE users; --", "password": "password"}
            response = requests.post(f"{self.api_base}/auth/login/", json=payload)
            if response.status_code in [400, 401]:
                tests.append({"test": "SQL injection in login blocked", "status": "PASS"})
            else:
                tests.append({"test": "SQL injection in login blocked", "status": "FAIL", "details": f"Got {response.status_code}"})
        except Exception as e:
            tests.append({"test": "SQL injection in login blocked", "status": "ERROR", "details": str(e)})
        
        self.results['authentication'] = tests
        
        for test in tests:
            status_icon = "✅" if test['status'] == 'PASS' else "❌" if test['status'] == 'FAIL' else "⚠️"
            print(f"  {status_icon} {test['test']}")
            if test['status'] != 'PASS':
                self.vulnerabilities.append(f"Authentication: {test['test']} - {test.get('details', '')}")
    
    def test_input_validation(self):
        """Test input validation security"""
        print("\n🛡️ Testing Input Validation...")
        
        tests = []
        
        # XSS payloads
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "onload=alert('xss')"
        ]
        
        for payload in xss_payloads:
            try:
                data = {"title": payload, "description": "test", "amount": "100"}
                response = requests.post(f"{self.api_base}/requests/", json=data)
                if response.status_code in [400, 401, 403]:
                    tests.append({"test": f"XSS payload blocked: {payload[:20]}...", "status": "PASS"})
                else:
                    tests.append({"test": f"XSS payload blocked: {payload[:20]}...", "status": "FAIL", "details": f"Got {response.status_code}"})
            except Exception as e:
                tests.append({"test": f"XSS payload blocked: {payload[:20]}...", "status": "ERROR", "details": str(e)})
        
        self.results['input_validation'] = tests
        
        for test in tests:
            status_icon = "✅" if test['status'] == 'PASS' else "❌" if test['status'] == 'FAIL' else "⚠️"
            print(f"  {status_icon} {test['test']}")
            if test['status'] != 'PASS':
                self.vulnerabilities.append(f"Input Validation: {test['test']} - {test.get('details', '')}")
    
    def test_file_upload_security(self):
        """Test file upload security"""
        print("\n📁 Testing File Upload Security...")
        
        tests = []
        
        # Test malicious file types
        malicious_files = [
            ("malicious.exe", b"MZ\x90\x00", "application/octet-stream"),
            ("script.php", b"<?php system($_GET['cmd']); ?>", "application/x-php"),
            ("malware.bat", b"@echo off\nformat c: /y", "application/x-msdos-program")
        ]
        
        for filename, content, content_type in malicious_files:
            try:
                files = {'proforma': (filename, content, content_type)}
                data = {'title': 'Test', 'description': 'Test', 'amount': '100'}
                response = requests.post(f"{self.api_base}/requests/", files=files, data=data)
                
                if response.status_code in [400, 401, 403]:
                    tests.append({"test": f"Malicious file blocked: {filename}", "status": "PASS"})
                else:
                    tests.append({"test": f"Malicious file blocked: {filename}", "status": "FAIL", "details": f"Got {response.status_code}"})
            except Exception as e:
                tests.append({"test": f"Malicious file blocked: {filename}", "status": "ERROR", "details": str(e)})
        
        self.results['file_upload'] = tests
        
        for test in tests:
            status_icon = "✅" if test['status'] == 'PASS' else "❌" if test['status'] == 'FAIL' else "⚠️"
            print(f"  {status_icon} {test['test']}")
            if test['status'] != 'PASS':
                self.vulnerabilities.append(f"File Upload: {test['test']} - {test.get('details', '')}")
    
    def test_security_headers(self):
        """Test security headers"""
        print("\n🔒 Testing Security Headers...")
        
        tests = []
        required_headers = [
            "X-Frame-Options",
            "X-Content-Type-Options",
            "X-XSS-Protection"
        ]
        
        try:
            response = requests.get(f"{self.api_base}/")
            headers = response.headers
            
            for header in required_headers:
                if header in headers:
                    tests.append({"test": f"{header} header present", "status": "PASS"})
                else:
                    tests.append({"test": f"{header} header present", "status": "FAIL", "details": "Header missing"})
            
            # Check HTTPS redirect (if applicable)
            if 'Strict-Transport-Security' in headers:
                tests.append({"test": "HSTS header present", "status": "PASS"})
            else:
                tests.append({"test": "HSTS header present", "status": "WARN", "details": "Consider adding for production"})
                
        except Exception as e:
            tests.append({"test": "Security headers check", "status": "ERROR", "details": str(e)})
        
        self.results['security_headers'] = tests
        
        for test in tests:
            status_icon = "✅" if test['status'] == 'PASS' else "❌" if test['status'] == 'FAIL' else "⚠️"
            print(f"  {status_icon} {test['test']}")
            if test['status'] == 'FAIL':
                self.vulnerabilities.append(f"Security Headers: {test['test']} - {test.get('details', '')}")
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        print("\n⏱️ Testing Rate Limiting...")
        
        tests = []
        
        # Test rapid requests
        try:
            responses = []
            for i in range(10):
                response = requests.get(f"{self.api_base}/")
                responses.append(response.status_code)
            
            # Check if any requests were rate limited
            rate_limited = any(status == 429 for status in responses)
            if rate_limited:
                tests.append({"test": "Rate limiting active", "status": "PASS"})
            else:
                tests.append({"test": "Rate limiting active", "status": "WARN", "details": "No rate limiting detected"})
                
        except Exception as e:
            tests.append({"test": "Rate limiting test", "status": "ERROR", "details": str(e)})
        
        self.results['rate_limiting'] = tests
        
        for test in tests:
            status_icon = "✅" if test['status'] == 'PASS' else "❌" if test['status'] == 'FAIL' else "⚠️"
            print(f"  {status_icon} {test['test']}")
            if test['status'] == 'FAIL':
                self.vulnerabilities.append(f"Rate Limiting: {test['test']} - {test.get('details', '')}")
    
    def check_dependencies(self):
        """Check for vulnerable dependencies"""
        print("\n📦 Checking Dependencies...")
        
        try:
            # Run safety check if available
            result = subprocess.run(['safety', 'check'], capture_output=True, text=True)
            if result.returncode == 0:
                print("  ✅ No known vulnerabilities in dependencies")
            else:
                print("  ⚠️ Potential vulnerabilities found:")
                print(result.stdout)
                self.vulnerabilities.append("Dependencies: Potential vulnerabilities found")
        except FileNotFoundError:
            print("  ⚠️ Safety tool not installed (pip install safety)")
        except Exception as e:
            print(f"  ❌ Dependency check failed: {e}")
    
    def generate_security_report(self):
        """Generate security audit report"""
        print("\n🔍 Security Audit Report")
        print("=" * 50)
        
        total_tests = sum(len(tests) for tests in self.results.values())
        passed_tests = sum(1 for tests in self.results.values() for test in tests if test['status'] == 'PASS')
        failed_tests = sum(1 for tests in self.results.values() for test in tests if test['status'] == 'FAIL')
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.vulnerabilities:
            print(f"\n❌ {len(self.vulnerabilities)} Vulnerabilities Found:")
            for vuln in self.vulnerabilities:
                print(f"  • {vuln}")
        else:
            print("\n✅ No critical vulnerabilities found!")
        
        # Save detailed report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"security_audit_{timestamp}.json"
        
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'success_rate': (passed_tests/total_tests)*100
            },
            'vulnerabilities': self.vulnerabilities,
            'detailed_results': self.results
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_file}")
        
        return len(self.vulnerabilities) == 0

def main():
    print("🔒 Starting Security Audit...")
    print(f"Timestamp: {datetime.now()}")
    
    auditor = SecurityAuditor()
    
    try:
        auditor.test_authentication_security()
        auditor.test_input_validation()
        auditor.test_file_upload_security()
        auditor.test_security_headers()
        auditor.test_rate_limiting()
        auditor.check_dependencies()
        
        secure = auditor.generate_security_report()
        
        if secure:
            print("\n✅ Security audit passed!")
            sys.exit(0)
        else:
            print("\n❌ Security vulnerabilities found!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  Audit interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Audit failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()