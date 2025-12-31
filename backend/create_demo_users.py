#!/usr/bin/env python3
"""
Create demo users for testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings.local')
django.setup()

from procure_to_pay.apps.authentication.models import User

def create_demo_users():
    """Create demo users for testing"""
    users = [
        {
            'email': 'staff1@example.com',
            'username': 'staff1',
            'first_name': 'Staff',
            'last_name': 'User',
            'role': 'staff',
            'password': 'password123'
        },
        {
            'email': 'approver1@example.com',
            'username': 'approver1',
            'first_name': 'Approver',
            'last_name': 'Level1',
            'role': 'approver_level_1',
            'password': 'password123'
        },
        {
            'email': 'approver2@example.com',
            'username': 'approver2',
            'first_name': 'Approver',
            'last_name': 'Level2',
            'role': 'approver_level_2',
            'password': 'password123'
        },
        {
            'email': 'finance1@example.com',
            'username': 'finance1',
            'first_name': 'Finance',
            'last_name': 'User',
            'role': 'finance',
            'password': 'password123'
        }
    ]
    
    for user_data in users:
        password = user_data.pop('password')
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults=user_data
        )
        if created:
            user.set_password(password)
            user.save()
            print(f"Created user: {user.email}")
        else:
            print(f"User exists: {user.email}")

if __name__ == "__main__":
    create_demo_users()