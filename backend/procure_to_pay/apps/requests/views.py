from rest_framework import generics, status
from rest_framework.decorators import action
from django.http import HttpResponse, Http404
from django.conf import settings
import os
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import PurchaseRequest, Approval, RequestItem
from .serializers import PurchaseRequestSerializer, RequestItemSerializer
from .permissions import CanApproveRequest, CanUpdateRequest
from ..documents.services import DocumentProcessor

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
        )
        
        # Only use .only() for list views, not for detail views
        if self.action == 'list':
            base_queryset = base_queryset.only(
                'id', 'title', 'description', 'amount', 'status', 
                'created_at', 'updated_at', 'created_by__id', 
                'created_by__email', 'created_by__first_name', 'created_by__last_name'
            )
        
        if user.role == 'staff':
            return base_queryset.filter(created_by=user)
        elif user.role in ['approver_level_1', 'approver_level_2']:
            # Return all requests for approvers to see their approval history
            return base_queryset.all()
        elif user.role == 'finance':
            return base_queryset.all()
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
        
        comments = request.data.get('comments', '').strip()
        
        approval, created = Approval.objects.get_or_create(
            request=purchase_request,
            approver=request.user,
            defaults={
                'approved': approved,
                'comments': comments
            }
        )
        
        if not created:
            return Response({'error': 'You have already reviewed this request'}, 
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
                    from ..documents.services import POGenerator
                    po_generator = POGenerator()
                    po_file = po_generator.generate_po(purchase_request)
                    purchase_request.purchase_order = po_file
                    purchase_request.save()
                    print(f"PO generated successfully for request {purchase_request.id}")
                except Exception as e:
                    print(f"PO generation failed for request {purchase_request.id}: {e}")
                    # Log error but don't fail the approval
        
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
                print(f"Proforma processing failed: {e}")
                pass
        
        response = super().update(request, *args, **kwargs)
        
        # Store file content in database after update
        if response.status_code == 200 and 'proforma' in request.FILES:
            try:
                uploaded_file = request.FILES['proforma']
                
                # Store file content in database
                uploaded_file.seek(0)
                instance.proforma_content = uploaded_file.read()
                instance.proforma_filename = uploaded_file.name
                instance.proforma_content_type = uploaded_file.content_type or 'application/octet-stream'
                instance.save()
                
            except Exception as e:
                print(f"Failed to store proforma content: {e}")
        
        return response
    
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
                print(f"Proforma processing failed: {e}")
                pass
        
        response = super().create(request, *args, **kwargs)
        
        # Store file content in database after creation
        if response.status_code == 201 and 'proforma' in request.FILES:
            try:
                purchase_request = PurchaseRequest.objects.get(id=response.data['id'])
                uploaded_file = request.FILES['proforma']
                
                # Store file content in database
                uploaded_file.seek(0)
                purchase_request.proforma_content = uploaded_file.read()
                purchase_request.proforma_filename = uploaded_file.name
                purchase_request.proforma_content_type = uploaded_file.content_type or 'application/octet-stream'
                purchase_request.save()
                
            except Exception as e:
                print(f"Failed to store proforma content: {e}")
        
        return response
    
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
            
            # Store receipt file and content
            purchase_request.receipt = receipt
            purchase_request.receipt_data = receipt_data
            purchase_request.validation_results = validation_results
            
            # Store receipt content in database
            receipt.seek(0)
            purchase_request.receipt_content = receipt.read()
            purchase_request.receipt_filename = receipt.name
            purchase_request.receipt_content_type = receipt.content_type or 'application/octet-stream'
            
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
    
    @extend_schema(
        description="Download document file (Finance users only)",
        responses={200: None, 403: None, 404: None},
        tags=['Purchase Requests']
    )
    @action(detail=True, methods=['get'], url_path='download/(?P<doc_type>\w+)')
    def download_document(self, request, pk=None, doc_type=None):
        purchase_request = self.get_object()
        
        # Allow staff, finance, and approvers to download documents
        if request.user.role not in ['finance', 'staff', 'approver_level_1', 'approver_level_2']:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        file_content = None
        filename = None
        content_type = 'application/octet-stream'
        
        # Get file from database storage
        if doc_type == 'proforma':
            if purchase_request.proforma_content:
                file_content = purchase_request.proforma_content
                filename = purchase_request.proforma_filename or f'proforma-{pk}.pdf'
                content_type = purchase_request.proforma_content_type or 'application/pdf'
            else:
                return Response({'error': 'No proforma document found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        elif doc_type == 'purchase_order':
            if purchase_request.purchase_order_content:
                file_content = purchase_request.purchase_order_content
                filename = purchase_request.purchase_order_filename or f'purchase-order-{pk}.pdf'
                content_type = 'application/pdf'
            elif purchase_request.status == 'approved':
                # Generate PO on demand
                try:
                    from ..documents.services import POGenerator
                    po_generator = POGenerator()
                    po_file = po_generator.generate_po(purchase_request)
                    
                    # Store PO content in database
                    if hasattr(po_file, 'read'):
                        po_file.seek(0)
                        file_content = po_file.read()
                    else:
                        file_content = po_file.getvalue() if hasattr(po_file, 'getvalue') else po_file
                    
                    purchase_request.purchase_order_content = file_content
                    purchase_request.purchase_order_filename = f'PO-{pk}.pdf'
                    purchase_request.save()
                    
                    filename = f'purchase-order-{pk}.pdf'
                    content_type = 'application/pdf'
                    
                except Exception as e:
                    return Response({'error': f'Failed to generate PO: {str(e)}'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({'error': 'No purchase order found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        elif doc_type == 'receipt':
            if purchase_request.receipt_content:
                file_content = purchase_request.receipt_content
                filename = purchase_request.receipt_filename or f'receipt-{pk}.pdf'
                content_type = purchase_request.receipt_content_type or 'application/pdf'
            else:
                return Response({'error': 'No receipt document found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        if not file_content:
            return Response({'error': f'No {doc_type} content available'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Serve the file from database
        try:
            response = HttpResponse(file_content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(file_content)
            return response
            
        except Exception as e:
            return Response({'error': f'Failed to serve file: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)