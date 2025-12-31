import re
import bleach
from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation

class InputSanitizer:
    @staticmethod
    def sanitize_text(text, max_length=1000):
        """Sanitize text input to prevent XSS"""
        if not text:
            return ""
        
        # Remove HTML tags and limit length
        clean_text = bleach.clean(str(text), tags=[], strip=True)
        return clean_text[:max_length]
    
    @staticmethod
    def validate_amount(amount):
        """Validate monetary amounts"""
        try:
            decimal_amount = Decimal(str(amount))
            if decimal_amount < 0:
                raise ValidationError("Amount cannot be negative")
            if decimal_amount > Decimal('999999.99'):
                raise ValidationError("Amount too large")
            return decimal_amount
        except (InvalidOperation, ValueError):
            raise ValidationError("Invalid amount format")
    
    @staticmethod
    def validate_filename(filename):
        """Validate and sanitize filenames"""
        if not filename:
            raise ValidationError("Filename required")
        
        # Remove path traversal attempts
        clean_name = re.sub(r'[^\w\-_\.]', '', filename)
        if not clean_name or len(clean_name) > 255:
            raise ValidationError("Invalid filename")
        
        return clean_name

class RateLimiter:
    """Simple rate limiting for API endpoints"""
    
    @staticmethod
    def check_upload_limit(user, max_uploads_per_hour=10):
        """Check if user has exceeded upload limits"""
        from django.utils import timezone
        from datetime import timedelta
        from ..documents.models import DocumentProcessing
        
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_uploads = DocumentProcessing.objects.filter(
            processed_at__gte=one_hour_ago
        ).count()
        
        if recent_uploads >= max_uploads_per_hour:
            raise ValidationError("Upload limit exceeded. Try again later.")