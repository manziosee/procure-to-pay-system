from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import PurchaseRequest, Approval
from .serializers import PurchaseRequestSerializer
from .permissions import CanApproveRequest, CanUpdateRequest

class PurchaseRequestViewSet(ModelViewSet):
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'staff':
            return PurchaseRequest.objects.filter(created_by=user)
        elif user.role in ['approver_level_1', 'approver_level_2']:
            return PurchaseRequest.objects.filter(status='pending')
        elif user.role == 'finance':
            return PurchaseRequest.objects.all()
        return PurchaseRequest.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [CanApproveRequest()]
        elif self.action in ['update', 'partial_update']:
            return [CanUpdateRequest()]
        return super().get_permissions()
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        return self._handle_approval(request, pk, True)
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        return self._handle_approval(request, pk, False)
    
    @transaction.atomic
    def _handle_approval(self, request, pk, approved):
        purchase_request = self.get_object()
        
        if purchase_request.status != 'pending':
            return Response({'error': 'Request is not pending'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        approval, created = Approval.objects.get_or_create(
            request=purchase_request,
            approver=request.user,
            defaults={
                'approved': approved,
                'comments': request.data.get('comments', '')
            }
        )
        
        if not created:
            return Response({'error': 'Already reviewed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not approved:
            purchase_request.status = 'rejected'
            purchase_request.save()
        else:
            # Check if all required approvals are complete
            required_approvers = ['approver_level_1', 'approver_level_2']
            approved_by_roles = set(
                purchase_request.approvals.filter(approved=True)
                .values_list('approver__role', flat=True)
            )
            
            if all(role in approved_by_roles for role in required_approvers):
                purchase_request.status = 'approved'
                purchase_request.save()
                # Trigger PO generation task here
        
        return Response(self.get_serializer(purchase_request).data)
    
    @action(detail=True, methods=['post'])
    def submit_receipt(self, request, pk=None):
        purchase_request = self.get_object()
        
        if request.user != purchase_request.created_by:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        receipt = request.FILES.get('receipt')
        if not receipt:
            return Response({'error': 'Receipt file required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        purchase_request.receipt = receipt
        purchase_request.save()
        
        return Response(self.get_serializer(purchase_request).data)