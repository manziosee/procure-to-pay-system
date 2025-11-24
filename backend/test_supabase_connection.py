#!/usr/bin/env python3
"""
Test script to verify Supabase database connection and API functionality
"""
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings')
sys.path.append('/home/manzi/Project/procure-to-pay-system/backend')
django.setup()

from django.contrib.auth import get_user_model
from procure_to_pay.apps.requests.models import PurchaseRequest
from django.db import connection

def test_database_connection():
    """Test basic database connectivity"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Database connected successfully!")
            print(f"   PostgreSQL version: {version[0]}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_user_model():
    """Test user model and demo users"""
    try:
        User = get_user_model()
        users = User.objects.all()
        print(f"✅ User model working!")
        print(f"   Total users: {users.count()}")
        
        for user in users:
            print(f"   - {user.username} ({user.role})")
        return True
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def test_purchase_request_model():
    """Test purchase request model"""
    try:
        requests = PurchaseRequest.objects.all()
        print(f"✅ PurchaseRequest model working!")
        print(f"   Total requests: {requests.count()}")
        return True
    except Exception as e:
        print(f"❌ PurchaseRequest model test failed: {e}")
        return False

def main():
    print("🔍 Testing Supabase Database Connection...")
    print("=" * 50)
    
    # Test database connection
    db_ok = test_database_connection()
    print()
    
    # Test user model
    user_ok = test_user_model()
    print()
    
    # Test purchase request model
    request_ok = test_purchase_request_model()
    print()
    
    # Summary
    print("=" * 50)
    if db_ok and user_ok and request_ok:
        print("🎉 All tests passed! Supabase integration is working correctly.")
        print("\n📊 Database Configuration:")
        print(f"   Host: {settings.DATABASES['default']['HOST']}")
        print(f"   Database: {settings.DATABASES['default']['NAME']}")
        print(f"   User: {settings.DATABASES['default']['USER']}")
    else:
        print("⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()