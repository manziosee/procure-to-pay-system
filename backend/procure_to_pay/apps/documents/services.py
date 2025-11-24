import pytesseract
import pdfplumber
from PIL import Image
from openai import OpenAI
import json
import re
import tempfile
import os
import magic
from decimal import Decimal
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
from ...utils.error_handler import ErrorLogger

class DocumentProcessor:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"OpenAI client initialization failed: {e}")
                self.client = None
    
    def extract_text_from_image(self, image_path):
        return pytesseract.image_to_string(Image.open(image_path))
    
    def extract_text_from_pdf(self, pdf_path):
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    def process_proforma(self, file_input):
        """Process proforma - accepts file path or uploaded file object"""
        # Validate file before processing
        self._validate_file_security(file_input)
        
        file_path = self._handle_file_input(file_input)
        try:
            text = self._extract_text(file_path)
            return self._extract_proforma_data(text)
        except Exception as e:
            ErrorLogger.log_file_processing_error(getattr(file_input, 'name', 'unknown'), str(e))
            raise
        finally:
            self._cleanup_temp_file(file_path, file_input)
    
    def process_receipt(self, file_input):
        """Process receipt - accepts file path or uploaded file object"""
        # Validate file before processing
        self._validate_file_security(file_input)
        
        file_path = self._handle_file_input(file_input)
        try:
            text = self._extract_text(file_path)
            return self._extract_receipt_data(text)
        except Exception as e:
            ErrorLogger.log_file_processing_error(getattr(file_input, 'name', 'unknown'), str(e))
            raise
        finally:
            self._cleanup_temp_file(file_path, file_input)
    
    def _handle_file_input(self, file_input):
        """Handle both file paths and uploaded file objects"""
        if isinstance(file_input, str):
            return file_input
        
        # Handle uploaded file object
        if hasattr(file_input, 'temporary_file_path'):
            return file_input.temporary_file_path()
        
        # For in-memory files, create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=self._get_file_extension(file_input))
        for chunk in file_input.chunks():
            temp_file.write(chunk)
        temp_file.close()
        return temp_file.name
    
    def _get_file_extension(self, file_obj):
        """Get file extension from uploaded file"""
        if hasattr(file_obj, 'name') and file_obj.name:
            return os.path.splitext(file_obj.name)[1]
        return '.tmp'
    
    def _cleanup_temp_file(self, file_path, original_input):
        """Clean up temporary files if we created them"""
        if not isinstance(original_input, str) and not hasattr(original_input, 'temporary_file_path'):
            try:
                os.unlink(file_path)
            except:
                pass
    
    def _extract_text(self, file_path):
        if file_path.lower().endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        elif file_path.lower().endswith(('.txt', '.text')):
            # Handle text files directly
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            # Handle image files
            try:
                return self.extract_text_from_image(file_path)
            except Exception as e:
                # If image processing fails, try reading as text
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()
                except:
                    raise e
    
    def _extract_proforma_data(self, text):
        if self.client:
            return self._ai_extract_proforma(text)
        else:
            return self._basic_extract_proforma(text)
    
    def _ai_extract_proforma(self, text):
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract structured data from proforma invoice. Return only valid JSON with vendor, total_amount, items (array with name, quantity, unit_price), terms."},
                    {"role": "user", "content": f"Extract data from this document:\n{text}"}
                ],
                temperature=0
            )
            content = response.choices[0].message.content
            # Clean up response to ensure valid JSON
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            print(f"AI extraction failed: {e}")
            return self._basic_extract_proforma(text)
    
    def _basic_extract_proforma(self, text):
        return {
            'vendor': self._extract_vendor(text),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text),
            'terms': self._extract_terms(text)
        }
    
    def _extract_receipt_data(self, text):
        if self.client:
            return self._ai_extract_receipt(text)
        else:
            return self._basic_extract_receipt(text)
    
    def _ai_extract_receipt(self, text):
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract structured data from receipt. Return only valid JSON with seller, total_amount, items (array with name, quantity, unit_price), date."},
                    {"role": "user", "content": f"Extract data from this receipt:\n{text}"}
                ],
                temperature=0
            )
            content = response.choices[0].message.content
            # Clean up response to ensure valid JSON
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            print(f"AI extraction failed: {e}")
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
        patterns = [
            r'vendor[:\s]+([^\n]+)',
            r'supplier[:\s]+([^\n]+)', 
            r'from[:\s]+([^\n]+)',
            r'seller[:\s]+([^\n]+)',
            r'company[:\s]+([^\n]+)',
            r'^([A-Z][A-Za-z\s&]+(?:Ltd|Inc|Corp|LLC))',  # Company names
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                vendor = match.group(1).strip()
                if len(vendor) > 2:  # Avoid single characters
                    return vendor
        return "Unknown Vendor"
    
    def _extract_amount(self, text):
        # Look for currency amounts with better patterns
        patterns = [
            r'total[:\s]*\$?([0-9,]+\.?[0-9]*)',
            r'amount[:\s]*\$?([0-9,]+\.?[0-9]*)',
            r'grand\s+total[:\s]*\$?([0-9,]+\.?[0-9]*)',
            r'\$([0-9,]+\.?[0-9]*)\s*total',
            r'([0-9,]+\.[0-9]{2})\s*$'  # Amount at end of line
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount = match.group(1).replace(',', '')
                try:
                    float(amount)
                    return amount
                except:
                    continue
        return "0.00"
    
    def _extract_items(self, text):
        # Enhanced item extraction
        items = []
        # Look for line items with quantity and price patterns
        patterns = [
            r'(\d+)\s+([A-Za-z][^\n]*?)\s+\$?([0-9,]+\.?[0-9]*)',
            r'([A-Za-z][^\n]*?)\s+(\d+)\s+\$?([0-9,]+\.?[0-9]*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:5]:  # Limit to 5 items
                try:
                    if len(match) == 3:
                        qty, name, price = match
                        if qty.isdigit() and float(price.replace(',', '')) > 0:
                            items.append({
                                'name': name.strip(),
                                'quantity': int(qty),
                                'unit_price': price.replace(',', '')
                            })
                except:
                    continue
        
        return items
    
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
    
    def generate_po_from_proforma(self, proforma_data):
        """Generate PO data from proforma extracted data"""
        try:
            items = proforma_data.get('items', [])
            total = self._calculate_total(items)
            
            return {
                'vendor': proforma_data.get('vendor', ''),
                'items': items,
                'terms': proforma_data.get('terms', ''),
                'total': total
            }
        except Exception as e:
            print(f"Error generating PO: {e}")
            return {}
    
    def _calculate_total(self, items):
        """Calculate total from items list"""
        total = Decimal('0')
        for item in items:
            try:
                qty = Decimal(str(item.get('quantity', 0)))
                price = Decimal(str(item.get('unit_price', 0)))
                total += qty * price
            except (ValueError, TypeError):
                continue
        return total
    
    def validate_receipt_against_po(self, receipt_data, po_data):
        """Compare receipt items against PO items and return discrepancies"""
        discrepancies = []
        receipt_items = receipt_data.get('items', [])
        po_items = po_data.get('items', [])
        
        # Create lookup dict for PO items
        po_lookup = {item.get('name', '').lower(): item for item in po_items}
        
        for receipt_item in receipt_items:
            name = receipt_item.get('name', '').lower()
            qty = receipt_item.get('quantity', 0)
            price = receipt_item.get('unit_price', 0)
            
            # Find matching PO item
            po_item = None
            for po_name, po_data_item in po_lookup.items():
                if name in po_name or po_name in name:
                    po_item = po_data_item
                    break
            
            if not po_item:
                discrepancies.append({
                    'item': receipt_item.get('name', ''),
                    'reason': 'Item not found in PO'
                })
                continue
            
            po_qty = po_item.get('quantity', 0)
            po_price = po_item.get('unit_price', 0)
            
            if abs(float(qty) - float(po_qty)) > 0.01:
                discrepancies.append({
                    'item': receipt_item.get('name', ''),
                    'reason': f'Quantity mismatch: PO={po_qty}, Receipt={qty}'
                })
            
            if abs(float(price) - float(po_price)) > 0.01:
                discrepancies.append({
                    'item': receipt_item.get('name', ''),
                    'reason': f'Price mismatch: PO=${po_price}, Receipt=${price}'
                })
        
        return discrepancies
    
    def _validate_file_security(self, file_input):
        """Validate file for security issues"""
        if hasattr(file_input, 'size') and file_input.size > 10 * 1024 * 1024:  # 10MB limit
            raise ValidationError("File too large. Maximum size is 10MB.")
        
        if hasattr(file_input, 'name'):
            filename = file_input.name.lower()
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt']
            if not any(filename.endswith(ext) for ext in allowed_extensions):
                raise ValidationError("File type not allowed.")
        
        # Check MIME type if possible
        if hasattr(file_input, 'read'):
            file_input.seek(0)
            file_header = file_input.read(1024)
            file_input.seek(0)
            
            try:
                mime_type = magic.from_buffer(file_header, mime=True)
                allowed_mimes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
                if mime_type not in allowed_mimes:
                    raise ValidationError(f"File type {mime_type} not allowed.")
            except:
                pass  # If magic fails, continue with extension check

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