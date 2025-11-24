from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .services import DocumentProcessor
from .models import DocumentProcessing
from ..requests.security import RateLimiter
from ...utils.error_handler import ErrorLogger

@method_decorator(ratelimit(key='user', rate='10/h', method='POST'), name='post')
class ProcessDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @swagger_auto_schema(
        operation_description="Process document using AI/OCR to extract structured data",
        manual_parameters=[
            openapi.Parameter(
                'file',
                openapi.IN_FORM,
                description="Document file (PDF, JPG, PNG, TXT)",
                type=openapi.TYPE_FILE,
                required=True
            ),
            openapi.Parameter(
                'document_type',
                openapi.IN_FORM,
                description="Document type",
                type=openapi.TYPE_STRING,
                enum=['proforma', 'receipt'],
                required=True
            )
        ],
        responses={
            200: openapi.Response(
                description="Document processed successfully",
                examples={
                    "application/json": {
                        "message": "Document processed successfully",
                        "extracted_data": {
                            "vendor": "Test Supplier Ltd",
                            "total_amount": "1300.00",
                            "items": [
                                {
                                    "name": "Test Product A",
                                    "quantity": 2,
                                    "unit_price": "500.00"
                                }
                            ],
                            "terms": "Net 30 days"
                        },
                        "processing_method": "AI"
                    }
                }
            ),
            400: "Bad request - missing file or invalid type",
            500: "Document processing failed"
        },
        tags=['Documents']
    )
    def post(self, request):
        # Check rate limits
        try:
            RateLimiter.check_upload_limit(request.user)
        except Exception as e:
            ErrorLogger.log_security_event('rate_limit_exceeded', request.user, str(e))
            return Response({'error': str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        file = request.FILES.get('file')
        doc_type = request.data.get('document_type')
        
        if not file:
            return Response({'error': 'File is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not doc_type or doc_type not in ['proforma', 'receipt']:
            return Response({'error': 'Valid document_type required (proforma or receipt)'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        processor = DocumentProcessor()
        
        try:
            # Process the document
            if doc_type == 'proforma':
                extracted_data = processor.process_proforma(file)
            else:  # receipt
                extracted_data = processor.process_receipt(file)
            
            # Save processing record
            doc_processing = DocumentProcessing.objects.create(
                document_type=doc_type,
                file=file,
                extracted_data=extracted_data
            )
            
            # Determine processing method
            processing_method = "AI" if processor.client else "Basic"
            
            return Response({
                'message': 'Document processed successfully',
                'extracted_data': extracted_data,
                'processing_method': processing_method,
                'processing_id': doc_processing.id
            })
            
        except Exception as e:
            return Response({
                'error': f'Document processing failed: {str(e)}',
                'processing_method': "AI" if processor.client else "Basic"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)