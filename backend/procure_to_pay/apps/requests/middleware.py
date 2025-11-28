import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)

class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Monitor API performance and log slow queries"""
    
    def process_request(self, request):
        request.start_time = time.time()
        request.queries_before = len(connection.queries)
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            queries_count = len(connection.queries) - getattr(request, 'queries_before', 0)
            
            # Log slow requests (>1 second)
            if duration > 1.0:
                logger.warning(
                    f"Slow request: {request.method} {request.path} "
                    f"took {duration:.2f}s with {queries_count} queries"
                )
            
            # Log requests with many queries (>10)
            if queries_count > 10:
                logger.warning(
                    f"High query count: {request.method} {request.path} "
                    f"executed {queries_count} queries in {duration:.2f}s"
                )
            
            # Add performance headers in debug mode
            if settings.DEBUG:
                response['X-Response-Time'] = f"{duration:.3f}s"
                response['X-Query-Count'] = str(queries_count)
        
        return response

class SecurityLoggingMiddleware(MiddlewareMixin):
    """Log security-related events"""
    
    def process_request(self, request):
        # Log suspicious requests
        suspicious_patterns = [
            'admin', 'wp-admin', 'phpmyadmin', '.env', 'config',
            '../', '..\\', '<script', 'javascript:', 'eval('
        ]
        
        path = request.path.lower()
        if any(pattern in path for pattern in suspicious_patterns):
            logger.warning(
                f"Suspicious request: {request.method} {request.path} "
                f"from {self.get_client_ip(request)}"
            )
        
        # Log file upload attempts
        if request.FILES:
            for field_name, file in request.FILES.items():
                logger.info(
                    f"File upload: {file.name} ({file.size} bytes) "
                    f"to {request.path} from {self.get_client_ip(request)}"
                )
    
    def process_response(self, request, response):
        # Log authentication failures
        if response.status_code == 401:
            logger.warning(
                f"Authentication failed: {request.method} {request.path} "
                f"from {self.get_client_ip(request)}"
            )
        
        # Log authorization failures
        if response.status_code == 403:
            logger.warning(
                f"Authorization failed: {request.method} {request.path} "
                f"from {self.get_client_ip(request)} "
                f"user: {getattr(request.user, 'username', 'anonymous')}"
            )
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip