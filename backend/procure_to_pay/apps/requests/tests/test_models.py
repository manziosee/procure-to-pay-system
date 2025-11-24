from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from decimal import Decimal
from ..models import PurchaseRequest, RequestItem, Approval

User = get_user_model()

class PurchaseRequestModelTest(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='staff1', password='test123', role='staff'
        )
        self.approver1 = User.objects.create_user(
            username='approver1', password='test123', role='approver_level_1'
        )
        self.approver2 = User.objects.create_user(
            username='approver2', password='test123', role='approver_level_2'
        )

    def test_create_purchase_request(self):
        """Test creating a valid purchase request"""
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        self.assertEqual(request.status, 'pending')
        self.assertEqual(request.created_by, self.staff_user)

    def test_invalid_amount(self):
        """Test validation for invalid amounts"""
        with self.assertRaises(ValidationError):
            request = PurchaseRequest(
                title='Test Request',
                description='Test description',
                amount=Decimal('-100.00'),
                created_by=self.staff_user
            )
            request.full_clean()

    def test_xss_prevention_title(self):
        """Test XSS prevention in title"""
        with self.assertRaises(ValidationError):
            request = PurchaseRequest(
                title='<script>alert("xss")</script>',
                description='Test description',
                amount=Decimal('100.00'),
                created_by=self.staff_user
            )
            request.full_clean()

    def test_status_immutability(self):
        """Test that approved/rejected status cannot be changed"""
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user,
            status='approved'
        )
        
        with self.assertRaises(ValidationError):
            request.status = 'rejected'
            request.save()

    def test_approval_workflow(self):
        """Test multi-level approval workflow"""
        request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )
        
        # Level 1 approval
        approval1 = Approval.objects.create(
            request=request,
            approver=self.approver1,
            approved=True,
            comments='Approved by level 1'
        )
        
        # Level 2 approval
        approval2 = Approval.objects.create(
            request=request,
            approver=self.approver2,
            approved=True,
            comments='Approved by level 2'
        )
        
        self.assertEqual(request.approvals.count(), 2)
        self.assertTrue(all(a.approved for a in request.approvals.all()))

class RequestItemModelTest(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='staff1', password='test123', role='staff'
        )
        self.request = PurchaseRequest.objects.create(
            title='Test Request',
            description='Test description',
            amount=Decimal('100.00'),
            created_by=self.staff_user
        )

    def test_total_price_calculation(self):
        """Test automatic total price calculation"""
        item = RequestItem.objects.create(
            request=self.request,
            name='Test Item',
            quantity=5,
            unit_price=Decimal('20.00')
        )
        self.assertEqual(item.total_price, Decimal('100.00'))

    def test_item_validation(self):
        """Test item validation"""
        with self.assertRaises(ValidationError):
            item = RequestItem(
                request=self.request,
                name='',  # Empty name
                quantity=0,  # Invalid quantity
                unit_price=Decimal('-10.00')  # Negative price
            )
            item.full_clean()