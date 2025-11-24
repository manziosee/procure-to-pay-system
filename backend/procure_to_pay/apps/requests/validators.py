from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible
try:
    import magic
except ImportError:
    magic = None
import os

@deconstructible
class FileTypeValidator:
    """Validate file type using python-magic for security"""
    
    ALLOWED_TYPES = {
        'pdf': ['application/pdf'],
        'image': ['image/jpeg', 'image/png', 'image/jpg'],
        'document': ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    }
    
    def __init__(self, allowed_types='document'):
        self.allowed_types = self.ALLOWED_TYPES.get(allowed_types, self.ALLOWED_TYPES['document'])
    
    def __call__(self, file):
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise ValidationError('File size cannot exceed 10MB')
        
        # Check file content type using python-magic if available
        if magic:
            file.seek(0)
            file_content = file.read(1024)
            file.seek(0)
            
            try:
                mime_type = magic.from_buffer(file_content, mime=True)
                if mime_type not in self.allowed_types:
                    raise ValidationError(f'Invalid file type. Allowed: {", ".join(self.allowed_types)}')
            except Exception:
                raise ValidationError('Unable to determine file type')
        else:
            # Fallback to basic extension check if magic is not available
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
            file_ext = os.path.splitext(file.name)[1].lower()
            if file_ext not in allowed_extensions:
                raise ValidationError(f'Invalid file extension. Allowed: {", ".join(allowed_extensions)}')

@deconstructible
class SecureFilenameValidator:
    """Validate filename for security"""
    
    def __call__(self, file):
        filename = file.name
        if not filename:
            raise ValidationError('Filename is required')
        
        # Check for dangerous characters
        dangerous_chars = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
        if any(char in filename for char in dangerous_chars):
            raise ValidationError('Filename contains invalid characters')
        
        # Check filename length
        if len(filename) > 255:
            raise ValidationError('Filename too long')

def validate_amount(value):
    """Validate purchase amount"""
    if value <= 0:
        raise ValidationError('Amount must be greater than zero')
    if value > 1000000:  # 1M limit
        raise ValidationError('Amount cannot exceed 1,000,000')

def validate_title(value):
    """Validate title for XSS prevention"""
    dangerous_patterns = ['<script', 'javascript:', 'onload=', 'onerror=']
    value_lower = value.lower()
    if any(pattern in value_lower for pattern in dangerous_patterns):
        raise ValidationError('Title contains invalid content')
    if len(value.strip()) < 3:
        raise ValidationError('Title must be at least 3 characters')

def validate_description(value):
    """Validate description for XSS prevention"""
    dangerous_patterns = ['<script', 'javascript:', 'onload=', 'onerror=']
    value_lower = value.lower()
    if any(pattern in value_lower for pattern in dangerous_patterns):
        raise ValidationError('Description contains invalid content')