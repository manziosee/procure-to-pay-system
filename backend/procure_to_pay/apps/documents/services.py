import pytesseract
import pdfplumber
from PIL import Image
import openai
import json
import re
from decimal import Decimal
from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

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
        if settings.OPENAI_API_KEY:
            return self._ai_extract_proforma(text)
        else:
            return self._basic_extract_proforma(text)
    
    def _ai_extract_proforma(self, text):
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract structured data from proforma invoice. Return JSON with vendor, total_amount, items (name, quantity, unit_price), terms."},
                    {"role": "user", "content": text}
                ],
                temperature=0
            )
            return json.loads(response.choices[0].message.content)
        except:
            return self._basic_extract_proforma(text)
    
    def _basic_extract_proforma(self, text):
        return {
            'vendor': self._extract_vendor(text),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text),
            'terms': self._extract_terms(text)
        }
    
    def _extract_receipt_data(self, text):
        if settings.OPENAI_API_KEY:
            return self._ai_extract_receipt(text)
        else:
            return self._basic_extract_receipt(text)
    
    def _ai_extract_receipt(self, text):
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract structured data from receipt. Return JSON with seller, total_amount, items (name, quantity, unit_price), date."},
                    {"role": "user", "content": text}
                ],
                temperature=0
            )
            return json.loads(response.choices[0].message.content)
        except:
            return self._basic_extract_receipt(text)
    
    def _basic_extract_receipt(self, text):
        return {
            'seller': self._extract_vendor(text),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text),
            'date': self._extract_date(text)
        }
    
    def _extract_vendor(self, text):
        # Look for common vendor patterns
        patterns = [r'vendor[:\s]+([^\n]+)', r'supplier[:\s]+([^\n]+)', r'from[:\s]+([^\n]+)']
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "Unknown Vendor"
    
    def _extract_amount(self, text):
        # Look for currency amounts
        patterns = [r'total[:\s]*\$?([0-9,]+\.?[0-9]*)', r'amount[:\s]*\$?([0-9,]+\.?[0-9]*)']
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).replace(',', '')
        return "0.00"
    
    def _extract_items(self, text):
        # Basic item extraction - can be enhanced
        return []
    
    def _extract_terms(self, text):
        # Extract payment terms
        patterns = [r'terms[:\s]+([^\n]+)', r'payment[:\s]+([^\n]+)']
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "Net 30"
    
    def _extract_date(self, text):
        # Extract date patterns
        patterns = [r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', r'(\d{4}-\d{2}-\d{2})']
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None
    
    def validate_receipt_against_po(self, receipt_data, po_data):
        validation_results = {
            'valid': True,
            'discrepancies': [],
            'warnings': []
        }
        
        # Compare amounts
        try:
            receipt_amount = Decimal(str(receipt_data.get('total_amount', '0')))
            po_amount = Decimal(str(po_data.get('total_amount', '0')))
            
            if abs(receipt_amount - po_amount) > Decimal('0.01'):
                validation_results['valid'] = False
                validation_results['discrepancies'].append({
                    'field': 'total_amount',
                    'po_value': str(po_amount),
                    'receipt_value': str(receipt_amount)
                })
        except:
            validation_results['warnings'].append('Could not compare amounts')
        
        # Compare vendor/seller
        po_vendor = po_data.get('vendor', '').lower()
        receipt_seller = receipt_data.get('seller', '').lower()
        
        if po_vendor and receipt_seller and po_vendor not in receipt_seller and receipt_seller not in po_vendor:
            validation_results['valid'] = False
            validation_results['discrepancies'].append({
                'field': 'vendor',
                'po_value': po_data.get('vendor'),
                'receipt_value': receipt_data.get('seller')
            })
        
        return validation_results

class POGenerator:
    def generate_po(self, purchase_request):
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        p.drawString(100, 750, f"PURCHASE ORDER #{purchase_request.id}")
        p.drawString(100, 730, f"Date: {purchase_request.created_at.strftime('%Y-%m-%d')}")
        
        # Vendor info
        vendor = purchase_request.proforma_data.get('vendor', 'Unknown Vendor')
        p.drawString(100, 700, f"Vendor: {vendor}")
        
        # Request details
        p.drawString(100, 670, f"Title: {purchase_request.title}")
        p.drawString(100, 650, f"Description: {purchase_request.description}")
        p.drawString(100, 630, f"Amount: ${purchase_request.amount}")
        
        # Items
        y_position = 600
        p.drawString(100, y_position, "Items:")
        for item in purchase_request.items.all():
            y_position -= 20
            p.drawString(120, y_position, f"- {item.name}: {item.quantity} x ${item.unit_price} = ${item.total_price}")
        
        # Footer
        p.drawString(100, 100, "This is an automatically generated Purchase Order.")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return ContentFile(buffer.getvalue(), name=f'PO_{purchase_request.id}.pdf')