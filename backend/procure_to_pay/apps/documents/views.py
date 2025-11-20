from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .services import DocumentProcessor

class ProcessDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Process document using AI/OCR to extract structured data",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'document': openapi.Schema(
                    type=openapi.TYPE_FILE,
                    description="Document file (PDF, JPG, PNG)"
                ),
                'type': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['proforma', 'receipt'],
                    description="Document type"
                )
            },
            required=['document', 'type']
        ),
        responses={
            200: openapi.Response(
                description="Document processed successfully",
                examples={
                    "application/json": {
                        "message": "Document processed successfully",
                        "extracted_data": {
                            "vendor": "Office Depot",
                            "total_amount": "1500.00",
                            "items": [],
                            "terms": "Net 30"
                        }
                    }
                }
            ),
            400: "Bad request - missing file or invalid type",
            500: "Document processing failed"
        },
        tags=['Documents']
    )
    def post(self, request):
        file = request.FILES.get('document')
        doc_type = request.data.get('type')
        
        if not file or not doc_type:
            return Response({'error': 'Document and type required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        processor = DocumentProcessor()
        
        try:
            if doc_type == 'proforma':
                data = processor.process_proforma(file.temporary_file_path())
            elif doc_type == 'receipt':
                data = processor.process_receipt(file.temporary_file_path())
            else:
                return Response({'error': 'Invalid document type'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'message': 'Document processed successfully',
                'extracted_data': data
            })
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)