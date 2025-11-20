from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.exceptions import ValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import PurchaseRequest, Approval, RequestItem
from .serializers import PurchaseRequestSerializer, RequestItemSerializer
from .permissions import CanApproveRequest, CanUpdateRequest
from ..documents.services import DocumentProcessor, POGenerator

class PurchaseRequestViewSet(ModelViewSet):
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="List purchase requests (filtered by user role)",
        manual_parameters=[
            openapi.Parameter('status', openapi.IN_QUERY, description="Filter by status", type=openapi.TYPE_STRING),
            openapi.Parameter('page', openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
        ],
        responses={200: PurchaseRequestSerializer(many=True)},
        tags=['Purchase Requests']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Create new purchase request (Staff only)",
        request_body=PurchaseRequestSerializer,
        responses={
            201: PurchaseRequestSerializer,
            400: "Validation error",
            403: "Permission denied"
        },
        tags=['Purchase Requests']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Get purchase request details",
        responses={200: PurchaseRequestSerializer},
        tags=['Purchase Requests']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update purchase request (Staff only, pending requests)",
        request_body=PurchaseRequestSerializer,
        responses={
            200: PurchaseRequestSerializer,
            400: "Can only update pending requests",
            403: "Permission denied"
        },
        tags=['Purchase Requests']
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
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
    
    @swagger_auto_schema(
        method='patch',
        operation_description="Approve purchase request (Approvers only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'comments': openapi.Schema(type=openapi.TYPE_STRING, description='Approval comments')
            }
        ),
        responses={
            200: openapi.Response(
                description="Request approved successfully",
                examples={
                    "application/json": {
                        "message": "Request approved successfully",
                        "request": {"id": 1, "status": "approved"}
                    }
                }
            ),
            400: "Request is not pending or already reviewed",
            403: "Permission denied"
        },
        tags=['Purchase Requests']
    )
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        return self._handle_approval(request, pk, True)
    
    @swagger_auto_schema(
        method='patch',
        operation_description="Reject purchase request (Approvers only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'comments': openapi.Schema(type=openapi.TYPE_STRING, description='Rejection reason')
            }
        ),
        responses={
            200: openapi.Response(
                description="Request rejected successfully",
                examples={
                    "application/json": {
                        "message": "Request rejected successfully",
                        "request": {"id": 1, "status": "rejected"}
                    }
                }
            ),
            400: "Request is not pending or already reviewed",
            403: "Permission denied"
        },
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
                proforma_data = processor.process_proforma(
                    request.FILES['proforma'].temporary_file_path()
                )
                request.data['proforma_data'] = proforma_data
            except Exception as e:
                return Response({'error': f'Proforma processing failed: {str(e)}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return super().update(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        # Process proforma if uploaded
        if 'proforma' in request.FILES:
            processor = DocumentProcessor()
            try:
                proforma_data = processor.process_proforma(
                    request.FILES['proforma'].temporary_file_path()
                )
                request.data['proforma_data'] = proforma_data
            except Exception as e:
                return Response({'error': f'Proforma processing failed: {str(e)}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_description="Submit receipt for approved request (Staff only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'receipt': openapi.Schema(
                    type=openapi.TYPE_FILE,
                    description="Receipt file (PDF, JPG, PNG)"
                )
            },
            required=['receipt']
        ),
        responses={
            200: openapi.Response(
                description="Receipt submitted and validated",
                examples={
                    "application/json": {
                        "message": "Receipt submitted successfully",
                        "validation_results": {
                            "valid": True,
                            "discrepancies": [],
                            "warnings": []
                        }
                    }
                }
            ),
            400: "Receipt file required or request not approved",
            403: "Permission denied",
            500: "Receipt processing failed"
        },
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
            receipt_data = processor.process_receipt(receipt.temporary_file_path())
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
                'request': self.get_serializer(purchase_request).data
            })
        except Exception as e:
            return Response({'error': f'Receipt processing failed: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)