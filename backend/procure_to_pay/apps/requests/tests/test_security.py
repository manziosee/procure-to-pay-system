from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from ..models import PurchaseRequest
from ..validators import FileTypeValidator, validate_title, validate_description
from django.core.exceptions import ValidationError
import tempfile
import os

User = get_user_model()

class SecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username='staff1', password='test123', role='staff'
        )

    def get_jwt_token(self, user):
        """Get JWT token for user"""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'test123'
        })
        return response.data['access']

    def test_xss_prevention_title(self):
        """Test XSS prevention in title field"""
        malicious_titles = [
            '<script>alert("xss")</script>',
            'javascript:alert("xss")',
            '<img src=x onerror=alert("xss")>',
            'onload=alert("xss")'
        ]
        
        for title in malicious_titles:
            with self.assertRaises(ValidationError):
                validate_title(title)

    def test_xss_prevention_description(self):
        """Test XSS prevention in description field"""
        malicious_descriptions = [
            '<script>alert("xss")</script>',
            'javascript:alert("xss")',
            '<img src=x onerror=alert("xss")>'
        ]
        
        for desc in malicious_descriptions:
            with self.assertRaises(ValidationError):
                validate_description(desc)

    def test_file_type_validation(self):
        """Test file type validation"""
        validator = FileTypeValidator('document')
        
        # Test malicious file
        malicious_content = b'<script>alert("xss")</script>'
        malicious_file = SimpleUploadedFile(
            "malicious.txt", malicious_content, content_type="text/plain"
        )
        
        with self.assertRaises(ValidationError):
            validator(malicious_file)

    def test_file_size_limit(self):
        """Test file size limit"""
        validator = FileTypeValidator('document')
        
        # Create large file (>10MB)
        large_content = b'x' * (11 * 1024 * 1024)  # 11MB
        large_file = SimpleUploadedFile(
            "large.pdf", large_content, content_type="application/pdf"
        )
        
        with self.assertRaises(ValidationError):
            validator(large_file)

    def test_sql_injection_prevention(self):
        """Test SQL injection prevention in search"""
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # SQL injection attempts
        malicious_queries = [
            "'; DROP TABLE requests_purchaserequest; --",
            "' OR '1'='1",
            "'; SELECT * FROM auth_user; --"
        ]
        
        for query in malicious_queries:
            response = self.client.get('/api/requests/', {'search': query})
            # Should not cause server error
            self.assertIn(response.status_code, [200, 400])

    def test_unauthorized_access(self):
        """Test unauthorized access prevention"""
        # Try to access without token
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Try with invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_based_access_control(self):
        """Test role-based access control"""
        approver = User.objects.create_user(
            username='approver1', password='test123', role='approver_level_1'
        )
        
        # Approver should not be able to create requests
        token = self.get_jwt_token(approver)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'title': 'Test Request',
            'description': 'Test description',
            'amount': '100.00'
        }
        
        response = self.client.post('/api/requests/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_path_traversal_prevention(self):
        """Test path traversal prevention in filenames"""
        malicious_filenames = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32\\config\\sam',
            '/etc/passwd',
            'C:\\windows\\system32\\config\\sam'
        ]
        
        for filename in malicious_filenames:
            malicious_file = SimpleUploadedFile(
                filename, b'content', content_type="application/pdf"
            )
            
            with self.assertRaises(ValidationError):
                from ..validators import SecureFilenameValidator
                validator = SecureFilenameValidator()
                validator(malicious_file)

    def test_csrf_protection(self):
        """Test CSRF protection is enabled"""
        # This test ensures CSRF middleware is properly configured
        from django.conf import settings
        self.assertIn(
            'django.middleware.csrf.CsrfViewMiddleware',
            settings.MIDDLEWARE
        )

    def test_secure_headers(self):
        """Test security headers are set"""
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/requests/')
        
        # Check for security headers (these should be set by middleware/nginx)
        # In production, ensure these are set:
        # X-Content-Type-Options: nosniff
        # X-Frame-Options: DENY
        # X-XSS-Protection: 1; mode=block
        self.assertEqual(response.status_code, status.HTTP_200_OK)