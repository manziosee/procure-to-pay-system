#!/usr/bin/env python3
"""
Fix High Availability Database Synchronization
"""

import subprocess
import json

def get_machine_list():
    """Get list of all machines"""
    try:
        result = subprocess.run([
            'flyctl', 'machine', 'list', '--app', 'procure-to-pay-backend', '--json'
        ], capture_output=True, text=True, env={'PATH': '/home/manzi/.fly/bin:/usr/bin:/bin'})
        
        if result.returncode == 0:
            machines = json.loads(result.stdout)
            return machines
        else:
            print(f"Error getting machine list: {result.stderr}")
            return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def fix_machine_database(machine_id):
    """Fix database on a specific machine"""
    print(f"🔧 Fixing database on machine {machine_id}...")
    
    commands = [
        "python manage.py migrate",
        "python manage.py create_demo_users"
    ]
    
    for cmd in commands:
        try:
            result = subprocess.run([
                'flyctl', 'ssh', 'console', '--app', 'procure-to-pay-backend', 
                '--select', machine_id, '-C', cmd
            ], capture_output=True, text=True, env={'PATH': '/home/manzi/.fly/bin:/usr/bin:/bin'})
            
            if result.returncode == 0:
                print(f"  ✅ {cmd}: Success")
            else:
                print(f"  ❌ {cmd}: Failed - {result.stderr}")
        except Exception as e:
            print(f"  ❌ {cmd}: Error - {e}")

def main():
    print("🔄 High Availability Database Synchronization")
    print("=" * 50)
    
    # Get all machines
    machines = get_machine_list()
    
    if not machines:
        print("❌ Could not get machine list")
        return
    
    print(f"Found {len(machines)} machines:")
    for machine in machines:
        print(f"  • {machine['id']} ({machine['region']}) - {machine['state']}")
    
    # Fix each machine
    for machine in machines:
        if machine['state'] == 'started':
            fix_machine_database(machine['id'])
        else:
            print(f"⏭️ Skipping {machine['id']} (not started)")
    
    print("\n✅ Database synchronization completed!")
    print("🧪 Testing authentication...")
    
    # Test authentication
    import requests
    try:
        response = requests.post(
            "https://procure-to-pay-backend.fly.dev/api/auth/login/",
            json={"username": "staff1", "password": "password123"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Authentication working!")
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Authentication test error: {e}")

if __name__ == "__main__":
    main()