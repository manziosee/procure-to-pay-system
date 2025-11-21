#!/usr/bin/env python3
"""
Docker Build Validation Script
Checks for common issues that could cause build failures
"""

import os
import json
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} missing: {filepath}")
        return False

def check_requirements():
    """Check Python requirements.txt"""
    req_file = "backend/requirements.txt"
    if not check_file_exists(req_file, "Requirements file"):
        return False
    
    with open(req_file, 'r') as f:
        requirements = f.read()
        
    required_packages = [
        'Django', 'djangorestframework', 'gunicorn', 
        'psycopg2-binary', 'python-decouple'
    ]
    
    missing = []
    for pkg in required_packages:
        if pkg.lower() not in requirements.lower():
            missing.append(pkg)
    
    if missing:
        print(f"❌ Missing required packages: {missing}")
        return False
    
    print("✅ All required Python packages present")
    return True

def check_package_json():
    """Check frontend package.json"""
    pkg_file = "frontend/package.json"
    if not check_file_exists(pkg_file, "Package.json"):
        return False
    
    try:
        with open(pkg_file, 'r') as f:
            pkg_data = json.load(f)
        
        required_scripts = ['build', 'start']
        missing_scripts = []
        
        for script in required_scripts:
            if script not in pkg_data.get('scripts', {}):
                missing_scripts.append(script)
        
        if missing_scripts:
            print(f"❌ Missing npm scripts: {missing_scripts}")
            return False
        
        print("✅ Frontend package.json valid")
        return True
        
    except json.JSONDecodeError:
        print("❌ Invalid package.json format")
        return False

def check_dockerfiles():
    """Check Dockerfile configurations"""
    files_to_check = [
        ("backend/Dockerfile", "Backend Dockerfile"),
        ("frontend/Dockerfile", "Frontend Dockerfile"),
        ("frontend/Dockerfile.dev", "Frontend Dev Dockerfile"),
        ("docker-compose.yml", "Development Compose"),
        ("docker-compose.prod.yml", "Production Compose"),
    ]
    
    all_good = True
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_good = False
    
    return all_good

def check_settings():
    """Check Django settings structure"""
    settings_files = [
        "backend/procure_to_pay/settings/__init__.py",
        "backend/procure_to_pay/settings/base.py",
        "backend/procure_to_pay/settings/local.py",
        "backend/procure_to_pay/settings/production.py",
    ]
    
    all_good = True
    for filepath in settings_files:
        if not check_file_exists(filepath, f"Settings file"):
            all_good = False
    
    return all_good

def main():
    """Run all validation checks"""
    print("🔍 Validating Docker Build Configuration\n")
    
    checks = [
        ("Requirements.txt", check_requirements),
        ("Package.json", check_package_json),
        ("Docker files", check_dockerfiles),
        ("Django settings", check_settings),
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"\n📋 Checking {check_name}...")
        if not check_func():
            all_passed = False
    
    print("\n" + "="*50)
    
    if all_passed:
        print("🎉 All validation checks passed!")
        print("✅ Docker build should work without issues")
        print("\n📝 To build and run:")
        print("   docker-compose up --build")
        return 0
    else:
        print("❌ Some validation checks failed")
        print("🔧 Fix the issues above before building")
        return 1

if __name__ == "__main__":
    sys.exit(main())