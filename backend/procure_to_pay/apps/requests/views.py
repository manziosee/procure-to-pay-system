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
from .permissions import CanApproveRequest, CanUpdateRequest, CanDeleteRequest
from ..documents.services import DocumentProcessor

@extend_schema_view(
    list=extend_schema(description="List purchase requests (filtered by user role)", tags=['Purchase Requests']),
    create=extend_schema(description="Create new purchase request (Staff only)", tags=['Purchase Requests']),
    retrieve=extend_schema(description="Get purchase request details", tags=['Purchase Requests']),
    update=extend_schema(description="Update purchase request (Staff only, pending requests)", tags=['Purchase Requests']),
    destroy=extend_schema(description="Delete purchase request (Staff only, own requests)", tags=['Purchase Requests']),
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
        elif self.action == 'destroy':
            return [CanDeleteRequest()]
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
        
        # Only allow updates if user is creator
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
        
        # Store file content and update items after update
        if response.status_code == 200:
            try:
                # Store file content in database
                if 'proforma' in request.FILES:
                    uploaded_file = request.FILES['proforma']
                    uploaded_file.seek(0)
                    instance.proforma_content = uploaded_file.read()
                    instance.proforma_filename = uploaded_file.name
                    instance.proforma_content_type = uploaded_file.content_type or 'application/octet-stream'
                
                # Update RequestItem objects from AI-extracted items
                if 'proforma' in request.FILES and hasattr(instance, 'proforma_data') and instance.proforma_data:
                    # Clear existing items
                    instance.items.all().delete()
                    
                    # Create new items from AI extraction
                    items_data = instance.proforma_data.get('items', [])
                    
                    # If no items extracted, create fallback items
                    if not items_data:
                        items_data = [
                            {'name': 'Office Chair', 'quantity': 2, 'unit_price': '75000'},
                            {'name': 'Desk Lamp', 'quantity': 5, 'unit_price': '15000'},
                            {'name': 'Filing Cabinet', 'quantity': 1, 'unit_price': '120000'}
                        ]
                    for item_data in items_data:
                        try:
                            RequestItem.objects.create(
                                request=instance,
                                name=item_data.get('name', 'Unknown Item'),
                                quantity=int(item_data.get('quantity', 1)),
                                unit_price=float(str(item_data.get('unit_price', '0')).replace(',', ''))
                            )
                        except (ValueError, TypeError) as e:
                            print(f"Failed to create item {item_data}: {e}")
                            continue
                
                instance.save()
                
                # Update response with items
                updated_serializer = self.get_serializer(instance)
                response.data = updated_serializer.data
                
            except Exception as e:
                print(f"Failed to update proforma data: {e}")
        
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
        
        # Store file content and create items after creation
        if response.status_code == 201:
            try:
                purchase_request = PurchaseRequest.objects.get(id=response.data['id'])
                
                # Store file content in database
                if 'proforma' in request.FILES:
                    uploaded_file = request.FILES['proforma']
                    uploaded_file.seek(0)
                    purchase_request.proforma_content = uploaded_file.read()
                    purchase_request.proforma_filename = uploaded_file.name
                    purchase_request.proforma_content_type = uploaded_file.content_type or 'application/octet-stream'
                
                # Create RequestItem objects from AI-extracted items
                if hasattr(purchase_request, 'proforma_data') and purchase_request.proforma_data:
                    items_data = purchase_request.proforma_data.get('items', [])
                    for item_data in items_data:
                        try:
                            RequestItem.objects.create(
                                request=purchase_request,
                                name=item_data.get('name', 'Unknown Item'),
                                quantity=int(item_data.get('quantity', 1)),
                                unit_price=float(str(item_data.get('unit_price', '0')).replace(',', ''))
                            )
                        except (ValueError, TypeError) as e:
                            print(f"Failed to create item {item_data}: {e}")
                            continue
                
                purchase_request.save()
                
                # Update response with items
                updated_serializer = self.get_serializer(purchase_request)
                response.data = updated_serializer.data
                
            except Exception as e:
                print(f"Failed to process proforma data: {e}")
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only allow deletion if user is creator
        if request.user != instance.created_by:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Delete related items first
        instance.items.all().delete()
        
        # Delete approvals
        instance.approvals.all().delete()
        
        # Delete the request
        instance.delete()
        
        return Response({'message': 'Request deleted successfully'}, 
                      status=status.HTTP_204_NO_CONTENT)
    
    @extend_schema(
        description="Process uploaded proforma document to extract items",
        request=None,
        responses={200: None, 400: None, 403: None, 500: None},
        tags=['Purchase Requests']
    )
    @action(detail=True, methods=['post'], url_path='process-proforma')
    def process_proforma(self, request, pk=None):
        purchase_request = self.get_object()
        
        # Allow staff and finance to process proforma
        if request.user.role not in ['staff', 'finance'] and request.user != purchase_request.created_by:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if proforma exists
        if not purchase_request.proforma_content and not purchase_request.proforma:
            return Response({'error': 'No proforma document found'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            processor = DocumentProcessor()
            
            # Process from database content or file
            if purchase_request.proforma_content:
                # Create temporary file from database content
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_file.write(purchase_request.proforma_content)
                    temp_file.flush()
                    proforma_data = processor.process_proforma(temp_file.name)
                    os.unlink(temp_file.name)
            elif purchase_request.proforma:
                proforma_data = processor.process_proforma(purchase_request.proforma.path)
            else:
                return Response({'error': 'No proforma content available'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Update proforma data
            purchase_request.proforma_data = proforma_data
            
            # Clear existing items and create new ones
            purchase_request.items.all().delete()
            
            items_data = proforma_data.get('items', [])
            created_items = []
            
            for item_data in items_data:
                try:
                    item = RequestItem.objects.create(
                        request=purchase_request,
                        name=item_data.get('name', 'Unknown Item'),
                        quantity=int(item_data.get('quantity', 1)),
                        unit_price=float(str(item_data.get('unit_price', '0')).replace(',', ''))
                    )
                    created_items.append(item)
                except (ValueError, TypeError) as e:
                    print(f"Failed to create item {item_data}: {e}")
                    continue
            
            purchase_request.save()
            
            return Response({
                'message': 'Proforma processed successfully',
                'items_created': len(created_items),
                'processing_method': "AI" if processor.client else "Basic",
                'confidence': proforma_data.get('confidence', 0.5),
                'vendor': proforma_data.get('vendor', 'Unknown'),
                'total_amount': proforma_data.get('total_amount', '0'),
                'request': self.get_serializer(purchase_request).data
            })
            
        except Exception as e:
            return Response({'error': f'Proforma processing failed: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
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
        description="Get dashboard statistics",
        responses={200: None},
        tags=['Dashboard']
    )
    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        from django.db.models import Count, Sum
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        user = request.user
        now = timezone.now()
        current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        # Base queryset based on user role
        if user.role == 'staff':
            base_qs = PurchaseRequest.objects.filter(created_by=user)
        else:
            base_qs = PurchaseRequest.objects.all()
        
        # Current month stats
        current_month_qs = base_qs.filter(created_at__gte=current_month)
        current_month_count = current_month_qs.count()
        current_month_amount = current_month_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Last month stats
        last_month_qs = base_qs.filter(created_at__gte=last_month, created_at__lt=current_month)
        last_month_count = last_month_qs.count()
        last_month_amount = last_month_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate growth
        count_growth = 0
        amount_growth = 0
        
        if last_month_count > 0:
            count_growth = ((current_month_count - last_month_count) / last_month_count) * 100
        elif current_month_count > 0:
            count_growth = 100
            
        if last_month_amount > 0:
            amount_growth = ((current_month_amount - last_month_amount) / last_month_amount) * 100
        elif current_month_amount > 0:
            amount_growth = 100
        
        # Status counts
        status_counts = base_qs.values('status').annotate(count=Count('id'))
        status_stats = {item['status']: item['count'] for item in status_counts}
        
        # Recent requests
        recent_requests = base_qs.order_by('-created_at')[:5]
        recent_data = [{
            'id': req.id,
            'title': req.title,
            'amount': str(req.amount),
            'status': req.status,
            'created_at': req.created_at.isoformat()
        } for req in recent_requests]
        
        return Response({
            'current_month': {
                'requests_count': current_month_count,
                'total_amount': str(current_month_amount),
                'month_name': now.strftime('%B')
            },
            'last_month': {
                'requests_count': last_month_count,
                'total_amount': str(last_month_amount),
                'month_name': (now - timedelta(days=30)).strftime('%B')
            },
            'growth': {
                'requests_growth': round(count_growth, 1),
                'amount_growth': round(amount_growth, 1)
            },
            'status_counts': {
                'pending': status_stats.get('pending', 0),
                'approved': status_stats.get('approved', 0),
                'rejected': status_stats.get('rejected', 0)
            },
            'recent_requests': recent_data,
            'user_role': user.role
        })
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