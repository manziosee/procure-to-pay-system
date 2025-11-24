from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from ..models import PurchaseRequest, Approval
import json

User = get_user_model()

class PurchaseRequestViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.staff_user = User.objects.create_user(
            username='staff1', password='test123', role='staff'
        )
        self.approver1 = User.objects.create_user(
            username='approver1', password='test123', role='approver_level_1'
        )
        self.approver2 = User.objects.create_user(
            username='approver2', password='test123', role='approver_level_2'
        )
        self.finance_user = User.objects.create_user(
            username='finance1', password='test123', role='finance'
        )

    def get_jwt_token(self, user):
        """Get JWT token for user"""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'test123'
        })
        return response.data['access']

    def test_create_request_as_staff(self):
        """Test staff can create requests"""
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'title': 'Test Request',
            'description': 'Test description',
            'amount': '100.00'
        }
        
        response = self.client.post('/api/requests/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_by'], self.staff_user.id)

    def test_create_request_as_approver_fails(self):
        """Test approvers cannot create requests"""
        token = self.get_jwt_token(self.approver1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'title': 'Test Request',
            'description': 'Test description',
            'amount': '100.00'
        }
        
        response = self.client.post('/api/requests/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_request(self):
        """Test approval workflow"""
        # Create request as staff
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        
        # Approve as level 1
        token = self.get_jwt_token(self.approver1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.patch(
            f'/api/requests/{request.id}/approve/',
            {'comments': 'Approved by level 1'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check approval created
        self.assertTrue(
            Approval.objects.filter(
                request=request, 
                approver=self.approver1, 
                approved=True
            ).exists()
        )

    def test_reject_request(self):
        """Test rejection workflow"""
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        
        token = self.get_jwt_token(self.approver1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.patch(
            f'/api/requests/{request.id}/reject/',
            {'comments': 'Rejected for insufficient details'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        request.refresh_from_db()
        self.assertEqual(request.status, 'rejected')

    def test_staff_can_only_see_own_requests(self):
        """Test staff can only see their own requests"""
        other_staff = User.objects.create_user(
            username='staff2', password='test123', role='staff'
        )
        
        # Create requests for both staff
        request1 = PurchaseRequest.objects.create(
            title='Request 1',
            description='Description 1',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        request2 = PurchaseRequest.objects.create(
            title='Request 2',
            description='Description 2',
            amount=Decimal('200.00'),
            created_by=other_staff
        )
        
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], request1.id)

    def test_finance_can_see_all_requests(self):
        """Test finance can see all requests"""
        request1 = PurchaseRequest.objects.create(
            title='Request 1',
            description='Description 1',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        
        token = self.get_jwt_token(self.finance_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_update_pending_request(self):
        """Test updating pending request"""
        request = PurchaseRequest.objects.create(
            title='Original Title',
            description='Original description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'title': 'Updated Title',
            'description': 'Updated description',
            'amount': '150.00'
        }
        
        response = self.client.put(f'/api/requests/{request.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        request.refresh_from_db()
        self.assertEqual(request.title, 'Updated Title')

    def test_cannot_update_approved_request(self):
        """Test cannot update approved request"""
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user,
            status='approved'
        )
        
        token = self.get_jwt_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {'title': 'Updated Title'}
        response = self.client.put(f'/api/requests/{request.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)