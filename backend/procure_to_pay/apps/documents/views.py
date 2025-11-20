from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import DocumentProcessor

class ProcessDocumentView(APIView):
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
            
            return Response({'extracted_data': data})
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)