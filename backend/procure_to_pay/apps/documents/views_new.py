from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Proforma, PurchaseOrder, Receipt
from .services import DocumentProcessor
from ..requests.models import PurchaseRequest

class ProformaUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Upload and process proforma invoice with AI extraction",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {
                        'type': 'string',
                        'format': 'binary',
                        'description': 'Proforma invoice file (PDF, JPG, PNG)'
                    }
                },
                'required': ['file']
            }
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    "message": "Proforma uploaded and processed successfully",
                    "proforma_id": 1,
                    "extracted_data": {
                        "vendor": "ABC Supplies Ltd",
                        "total": "1500.00",
                        "items": [{"name": "Office Chair", "qty": 2, "price": "750.00"}]
                    }
                },
                response_only=True
            )
        ],
        tags=['Proforma Workflow']
    )
    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        processor = DocumentProcessor()
        
        # Create proforma record
        proforma = Proforma.objects.create(
            file=file,
            uploaded_by=request.user
        )
        
        # Process the file
        try:
            extracted_data = processor.process_proforma(proforma.file.path)
            proforma.extracted_data = extracted_data
            proforma.vendor_name = extracted_data.get('vendor', '')
            proforma.save()
            
            return Response({
                'message': 'Proforma uploaded and processed successfully',
                'proforma_id': proforma.id,
                'extracted_data': extracted_data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            proforma.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GeneratePOView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Generate Purchase Order from processed proforma data",
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    "message": "Purchase Order generated successfully",
                    "po_id": 1,
                    "po_data": {
                        "vendor": "ABC Supplies Ltd",
                        "total": "1500.00",
                        "items": [{"name": "Office Chair", "qty": 2, "price": "750.00"}],
                        "terms": "Net 30 days"
                    }
                },
                response_only=True
            )
        ],
        tags=['Proforma Workflow']
    )
    def post(self, request, proforma_id):
        proforma = get_object_or_404(Proforma, id=proforma_id)
        processor = DocumentProcessor()
        
        # Generate PO from proforma data
        po_data = processor.generate_po_from_proforma(proforma.extracted_data)
        
        if not po_data:
            return Response({'error': 'Failed to generate PO'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create PO record
        po = PurchaseOrder.objects.create(
            vendor=po_data['vendor'],
            items=po_data['items'],
            terms=po_data['terms'],
            total=po_data['total'],
            proforma=proforma
        )
        
        return Response({
            'message': 'Purchase Order generated successfully',
            'po_id': po.id,
            'po_data': {
                'vendor': po.vendor,
                'total': str(po.total),
                'items': po.items,
                'terms': po.terms
            }
        }, status=status.HTTP_201_CREATED)

class ReceiptValidationView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Validate receipt against Purchase Order and detect discrepancies",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {
                        'type': 'string',
                        'format': 'binary',
                        'description': 'Receipt file (PDF, JPG, PNG)'
                    }
                },
                'required': ['file']
            }
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    "message": "Receipt processed and validated",
                    "receipt_id": 1,
                    "extracted_data": {
                        "vendor": "ABC Supplies Ltd",
                        "total": "1500.00",
                        "items": [{"name": "Office Chair", "qty": 2, "price": "750.00"}]
                    },
                    "discrepancies": [],
                    "validation_status": "valid"
                },
                response_only=True
            )
        ],
        tags=['Proforma Workflow']
    )
    def post(self, request, po_id):
        if 'file' not in request.FILES:
            return Response({'error': 'No receipt file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        po = get_object_or_404(PurchaseOrder, id=po_id)
        file = request.FILES['file']
        processor = DocumentProcessor()
        
        # Create receipt record
        receipt = Receipt.objects.create(
            file=file,
            po=po,
            uploaded_by=request.user
        )
        
        try:
            # Process receipt
            receipt_data = processor.process_receipt(receipt.file.path)
            receipt.extracted_data = receipt_data
            
            # Validate against PO
            discrepancies = processor.validate_receipt_against_po(
                receipt_data, 
                {'items': po.items, 'vendor': po.vendor}
            )
            receipt.discrepancies = discrepancies
            receipt.save()
            
            return Response({
                'message': 'Receipt processed and validated',
                'receipt_id': receipt.id,
                'extracted_data': receipt_data,
                'discrepancies': discrepancies,
                'validation_status': 'valid' if not discrepancies else 'discrepancies_found'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            receipt.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)