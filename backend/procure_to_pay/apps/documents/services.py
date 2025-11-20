import pytesseract
import pdfplumber
from PIL import Image
import openai
from django.conf import settings

class DocumentProcessor:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
    
    def extract_text_from_image(self, image_path):
        return pytesseract.image_to_string(Image.open(image_path))
    
    def extract_text_from_pdf(self, pdf_path):
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    def process_proforma(self, file_path):
        text = self._extract_text(file_path)
        return self._extract_proforma_data(text)
    
    def process_receipt(self, file_path):
        text = self._extract_text(file_path)
        return self._extract_receipt_data(text)
    
    def _extract_text(self, file_path):
        if file_path.lower().endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        else:
            return self.extract_text_from_image(file_path)
    
    def _extract_proforma_data(self, text):
        # Basic extraction logic - can be enhanced with AI
        return {
            'vendor': self._extract_field(text, 'vendor'),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text)
        }
    
    def _extract_receipt_data(self, text):
        return {
            'seller': self._extract_field(text, 'seller'),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text)
        }
    
    def _extract_field(self, text, field_type):
        # Placeholder for field extraction logic
        return f"extracted_{field_type}"
    
    def _extract_amount(self, text):
        # Placeholder for amount extraction
        return "0.00"
    
    def _extract_items(self, text):
        # Placeholder for items extraction
        return []