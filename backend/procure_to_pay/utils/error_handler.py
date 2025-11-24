import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses"""
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data,
            'status_code': response.status_code
        }
        
        # Log the error
        logger.error(f"API Error: {exc} - Context: {context}")
        
        response.data = custom_response_data
    
    return response

class ErrorLogger:
    @staticmethod
    def log_security_event(event_type, user, details):
        """Log security-related events"""
        logger.warning(f"Security Event: {event_type} - User: {user} - Details: {details}")
    
    @staticmethod
    def log_performance_issue(operation, duration, details):
        """Log performance issues"""
        if duration > 5:  # Log operations taking more than 5 seconds
            logger.warning(f"Performance Issue: {operation} took {duration}s - {details}")
    
    @staticmethod
    def log_file_processing_error(filename, error):
        """Log file processing errors"""
        logger.error(f"File Processing Error: {filename} - {error}")