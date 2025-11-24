#!/usr/bin/env python3
"""
Performance monitoring script for the procure-to-pay system
"""

import os
import sys
import django
import time
import requests
import psutil
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings.local')
django.setup()

from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()

class PerformanceMonitor:
    def __init__(self):
        self.api_base = "http://localhost:8000/api"
        self.results = {}
    
    def test_database_performance(self):
        """Test database query performance"""
        print("🔍 Testing Database Performance...")
        
        # Test query performance
        start_time = time.time()
        
        # Simulate common queries
        queries = [
            lambda: User.objects.count(),
            lambda: User.objects.filter(role='staff').count(),
            lambda: connection.cursor().execute("SELECT COUNT(*) FROM auth_user"),
        ]
        
        query_times = []
        for i, query in enumerate(queries):
            query_start = time.time()
            try:
                query()
                query_time = (time.time() - query_start) * 1000
                query_times.append(query_time)
                print(f"  Query {i+1}: {query_time:.2f}ms")
            except Exception as e:
                print(f"  Query {i+1}: ERROR - {e}")
        
        avg_query_time = sum(query_times) / len(query_times) if query_times else 0
        print(f"  Average Query Time: {avg_query_time:.2f}ms")
        
        # Check connection count
        with connection.cursor() as cursor:
            try:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                active_connections = cursor.fetchone()[0]
                print(f"  Active DB Connections: {active_connections}")
            except Exception as e:
                print(f"  Connection check failed: {e}")
        
        self.results['database'] = {
            'avg_query_time': avg_query_time,
            'status': 'PASS' if avg_query_time < 50 else 'FAIL'
        }
    
    def test_cache_performance(self):
        """Test cache performance"""
        print("\n💾 Testing Cache Performance...")
        
        try:
            # Test cache write
            start_time = time.time()
            cache.set('test_key', 'test_value', 60)
            write_time = (time.time() - start_time) * 1000
            print(f"  Cache Write: {write_time:.2f}ms")
            
            # Test cache read
            start_time = time.time()
            value = cache.get('test_key')
            read_time = (time.time() - start_time) * 1000
            print(f"  Cache Read: {read_time:.2f}ms")
            
            # Test cache hit
            cache_hit = value == 'test_value'
            print(f"  Cache Hit: {'✅' if cache_hit else '❌'}")
            
            # Clean up
            cache.delete('test_key')
            
            self.results['cache'] = {
                'write_time': write_time,
                'read_time': read_time,
                'status': 'PASS' if cache_hit and read_time < 10 else 'FAIL'
            }
            
        except Exception as e:
            print(f"  Cache test failed: {e}")
            self.results['cache'] = {'status': 'FAIL', 'error': str(e)}
    
    def test_api_performance(self):
        """Test API endpoint performance"""
        print("\n🌐 Testing API Performance...")
        
        endpoints = [
            '/health/',
            '/swagger.json',
        ]
        
        api_results = []
        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_base}{endpoint}", timeout=5)
                response_time = (time.time() - start_time) * 1000
                
                status = "✅ PASS" if response.status_code == 200 and response_time < 200 else "❌ FAIL"
                print(f"  {endpoint}: {response_time:.2f}ms - {status}")
                
                api_results.append({
                    'endpoint': endpoint,
                    'response_time': response_time,
                    'status_code': response.status_code,
                    'status': 'PASS' if response.status_code == 200 and response_time < 200 else 'FAIL'
                })
                
            except Exception as e:
                print(f"  {endpoint}: ERROR - {e}")
                api_results.append({
                    'endpoint': endpoint,
                    'status': 'FAIL',
                    'error': str(e)
                })
        
        avg_response_time = sum(r.get('response_time', 0) for r in api_results) / len(api_results)
        self.results['api'] = {
            'endpoints': api_results,
            'avg_response_time': avg_response_time,
            'status': 'PASS' if all(r.get('status') == 'PASS' for r in api_results) else 'FAIL'
        }
    
    def test_system_resources(self):
        """Test system resource usage"""
        print("\n💻 Testing System Resources...")
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        print(f"  CPU Usage: {cpu_percent}%")
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        print(f"  Memory Usage: {memory_percent}% ({memory.used // (1024**2)}MB / {memory.total // (1024**2)}MB)")
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100
        print(f"  Disk Usage: {disk_percent:.1f}% ({disk.used // (1024**3)}GB / {disk.total // (1024**3)}GB)")
        
        # Network connections
        connections = len(psutil.net_connections())
        print(f"  Network Connections: {connections}")
        
        self.results['system'] = {
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'disk_percent': disk_percent,
            'connections': connections,
            'status': 'PASS' if cpu_percent < 80 and memory_percent < 80 and disk_percent < 90 else 'WARN'
        }
    
    def generate_report(self):
        """Generate performance report"""
        print("\n📊 Performance Report")
        print("=" * 50)
        
        overall_status = "PASS"
        
        for component, data in self.results.items():
            status = data.get('status', 'UNKNOWN')
            if status == 'FAIL':
                overall_status = "FAIL"
            elif status == 'WARN' and overall_status == 'PASS':
                overall_status = "WARN"
            
            print(f"{component.upper()}: {status}")
        
        print(f"\nOVERALL STATUS: {overall_status}")
        
        # Save detailed results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"performance_report_{timestamp}.txt"
        
        with open(report_file, 'w') as f:
            f.write(f"Performance Report - {datetime.now()}\n")
            f.write("=" * 50 + "\n\n")
            
            for component, data in self.results.items():
                f.write(f"{component.upper()}:\n")
                for key, value in data.items():
                    f.write(f"  {key}: {value}\n")
                f.write("\n")
        
        print(f"\nDetailed report saved to: {report_file}")
        
        return overall_status == "PASS"

def main():
    print("🚀 Starting Performance Monitoring...")
    print(f"Timestamp: {datetime.now()}")
    
    monitor = PerformanceMonitor()
    
    try:
        monitor.test_database_performance()
        monitor.test_cache_performance()
        monitor.test_api_performance()
        monitor.test_system_resources()
        
        success = monitor.generate_report()
        
        if success:
            print("\n✅ All performance tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some performance tests failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  Monitoring interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Monitoring failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()