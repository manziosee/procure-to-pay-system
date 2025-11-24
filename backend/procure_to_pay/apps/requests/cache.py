from django.core.cache import cache
from django.conf import settings
import hashlib
import json

class RequestCache:
    """Caching utility for purchase requests"""
    
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @staticmethod
    def get_cache_key(user_id, filters=None):
        """Generate cache key for user requests"""
        key_data = f"requests_{user_id}"
        if filters:
            filter_str = json.dumps(filters, sort_keys=True)
            key_data += f"_{hashlib.md5(filter_str.encode()).hexdigest()}"
        return key_data
    
    @classmethod
    def get_requests(cls, user_id, filters=None):
        """Get cached requests"""
        cache_key = cls.get_cache_key(user_id, filters)
        return cache.get(cache_key)
    
    @classmethod
    def set_requests(cls, user_id, data, filters=None):
        """Cache requests data"""
        cache_key = cls.get_cache_key(user_id, filters)
        cache.set(cache_key, data, cls.CACHE_TIMEOUT)
    
    @classmethod
    def invalidate_user_cache(cls, user_id):
        """Invalidate all cache for a user"""
        # In production, use cache versioning or tags
        cache.delete_many([
            cls.get_cache_key(user_id),
            f"requests_{user_id}_*"
        ])
    
    @classmethod
    def invalidate_request_cache(cls, request_id):
        """Invalidate cache when request is updated"""
        # Clear all related caches
        cache.delete_pattern(f"requests_*")