from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import PurchaseRequest, Approval, RequestItem
from .serializers import PurchaseRequestSerializer, RequestItemSerializer
from .permissions import CanApproveRequest, CanUpdateRequest
from ..documents.services import DocumentProcessor, POGenerator

@extend_schema_view(
    list=extend_schema(description="List purchase requests (filtered by user role)", tags=['Purchase Requests']),
    create=extend_schema(description="Create new purchase request (Staff only)", tags=['Purchase Requests']),
    retrieve=extend_schema(description="Get purchase request details", tags=['Purchase Requests']),
    update=extend_schema(description="Update purchase request (Staff only, pending requests)", tags=['Purchase Requests']),
)
class PurchaseRequestViewSet(ModelViewSet):
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Handle swagger documentation generation
        if getattr(self, 'swagger_fake_view', False):
            return PurchaseRequest.objects.none()
            
        user = self.request.user
        if not user.is_authenticated:
            return PurchaseRequest.objects.none()
        
        # Optimize queries with select_related and prefetch_related
        base_queryset = PurchaseRequest.objects.select_related(
            'created_by'
        ).prefetch_related(
            'approvals__approver',
            'items'
        ).only(
            'id', 'title', 'description', 'amount', 'status', 
            'created_at', 'updated_at', 'created_by__id', 
            'created_by__email', 'created_by__first_name', 'created_by__last_name'
        )
        
        # Add caching for frequently accessed data
        from django.core.cache import cache
        cache_key = f'requests_{user.role}_{user.id}'
        
        if user.role == 'staff':
            return base_queryset.filter(created_by=user)
        elif user.role in ['approver_level_1', 'approver_level_2']:
            return base_queryset.filter(status='pending')
        elif user.role == 'finance':
            return base_queryset.all()[:100]  # Limit for performance
        return PurchaseRequest.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [CanApproveRequest()]
        elif self.action in ['update', 'partial_update']:
            return [CanUpdateRequest()]
        return super().get_permissions()
    
    @extend_schema(
        description="Approve purchase request (Approvers only)",
        request=None,
        responses={200: None, 400: None, 403: None},
        tags=['Purchase Requests']
    )
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        return self._handle_approval(request, pk, True)
    
    @extend_schema(
        description="Reject purchase request (Approvers only)",
        request=None,
        responses={200: None, 400: None, 403: None},
        tags=['Purchase Requests']
    )
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
                
                # Generate PO automatically
                try:
                    po_generator = POGenerator()
                    po_file = po_generator.generate_po(purchase_request)
                    purchase_request.purchase_order = po_file
                    purchase_request.save()
                except Exception as e:
                    # Log error but don't fail the approval
                    pass
        
        return Response({
            'message': f'Request {"approved" if approved else "rejected"} successfully',
            'request': self.get_serializer(purchase_request).data
        })
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only allow updates if pending and user is creator
        if instance.status != 'pending':
            return Response({'error': 'Can only update pending requests'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if request.user != instance.created_by:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Process proforma if uploaded
        if 'proforma' in request.FILES:
            processor = DocumentProcessor()
            try:
                uploaded_file = request.FILES['proforma']
                proforma_data = processor.process_proforma(uploaded_file)
                
                # Store extracted data
                if hasattr(request, '_mutable'):
                    request.data._mutable = True
                request.data['proforma_data'] = proforma_data
                
            except Exception as e:
                # Don't fail the update for processing errors
                print(f"Proforma processing failed: {e}")
                pass
        
        return super().update(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        # Process proforma if uploaded
        if 'proforma' in request.FILES:
            processor = DocumentProcessor()
            try:
                uploaded_file = request.FILES['proforma']
                proforma_data = processor.process_proforma(uploaded_file)
                
                # Store extracted data
                if hasattr(request, '_mutable'):
                    request.data._mutable = True
                request.data['proforma_data'] = proforma_data
                
            except Exception as e:
                # Don't fail the request creation for processing errors
                # Just log and continue without extracted data
                print(f"Proforma processing failed: {e}")
                pass
        
        return super().create(request, *args, **kwargs)
    
    @extend_schema(
        description="Submit receipt for approved request (Staff only)",
        request=None,
        responses={200: None, 400: None, 403: None, 500: None},
        tags=['Purchase Requests']
    )
    @action(detail=True, methods=['post'], url_path='submit-receipt')
    def submit_receipt(self, request, pk=None):
        purchase_request = self.get_object()
        
        if request.user != purchase_request.created_by:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if purchase_request.status != 'approved':
            return Response({'error': 'Can only submit receipt for approved requests'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        receipt = request.FILES.get('receipt')
        if not receipt:
            return Response({'error': 'Receipt file required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Process receipt with AI
        processor = DocumentProcessor()
        try:
            receipt_data = processor.process_receipt(receipt)
            validation_results = processor.validate_receipt_against_po(
                receipt_data, purchase_request.proforma_data
            )
            
            purchase_request.receipt = receipt
            purchase_request.receipt_data = receipt_data
            purchase_request.validation_results = validation_results
            purchase_request.save()
            
            return Response({
                'message': 'Receipt submitted successfully',
                'validation_results': validation_results,
                'processing_method': "AI" if processor.client else "Basic",
                'request': self.get_serializer(purchase_request).data
            })
        except Exception as e:
            return Response({'error': f'Receipt processing failed: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)