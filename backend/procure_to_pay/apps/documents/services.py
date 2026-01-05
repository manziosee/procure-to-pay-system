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
# from ...utils.error_handler import ErrorLogger

class ErrorLogger:
    @staticmethod
    def log_file_processing_error(filename, error):
        print(f"File processing error for {filename}: {error}")
    
    @staticmethod
    def log_security_event(event_type, user, details):
        print(f"Security event {event_type} for user {user}: {details}")

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
        """Extract text from images with enhanced OCR"""
        try:
            image = Image.open(image_path)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            text = pytesseract.image_to_string(image, config='--psm 6')
            
            if not text.strip():
                for psm in [3, 4, 6, 8, 11, 13]:
                    try:
                        text = pytesseract.image_to_string(image, config=f'--psm {psm}')
                        if text.strip():
                            break
                    except:
                        continue
            
            return text
            
        except Exception as e:
            print(f"OCR failed for {image_path}: {e}")
            return ""
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF with multiple fallback methods"""
        text = ""
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            if text.strip():
                return text
        except Exception as e:
            print(f"pdfplumber failed: {e}")
        
        try:
            import PyPDF2
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            
            if text.strip():
                return text
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
        
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
        """Extract text from various file formats with robust error handling"""
        text = ""
        file_ext = file_path.lower()
        
        try:
            # PDF files
            if file_ext.endswith('.pdf'):
                text = self.extract_text_from_pdf(file_path)
                if not text.strip():
                    text = self._extract_pdf_alternative(file_path)
            
            # Text files
            elif file_ext.endswith(('.txt', '.text', '.csv')):
                text = self._extract_text_file(file_path)
            
            # Image files
            elif file_ext.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif')):
                text = self.extract_text_from_image(file_path)
            
            # Unknown format - try multiple approaches
            else:
                text = self._extract_unknown_format(file_path)
            
            # Validate extracted text
            if not text or len(text.strip()) < 5:
                raise ValueError(f"Insufficient text extracted from {file_path}")
            
            return text.strip()
            
        except Exception as e:
            print(f"Text extraction failed for {file_path}: {e}")
            return f"Text extraction failed for file type: {file_ext}"
    
    def _extract_proforma_data(self, text):
        if self.client:
            return self._ai_extract_proforma(text)
        else:
            return self._basic_extract_proforma(text)
    
    def _ai_extract_proforma(self, text):
        try:
            if not text or len(text.strip()) < 10:
                raise ValueError("Insufficient text content for AI processing")
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": """You are an expert document processing AI specialized in proforma invoices and purchase orders.
                        
                        CRITICAL INSTRUCTIONS:
                        1. ITEMS: Look for sections labeled "Items", "Products", "Services", "Description", "Line Items", or similar
                        2. IDENTIFY REAL PRODUCTS: Extract only actual goods/services being sold (chairs, desks, software, etc.)
                        3. EXCLUDE NON-ITEMS: Never include subtotals, taxes, totals, invoice numbers, headers, or calculations
                        4. TOTAL AMOUNT: Find the FINAL amount due - usually labeled "Total", "Grand Total", "Amount Due", or "Final Total"
                        5. CURRENCY: Handle RWF, USD, EUR, and other currencies properly
                        6. QUANTITIES: Extract realistic quantities (1-1000 range)
                        7. UNIT PRICES: Extract individual item prices, not line totals
                        
                        ITEM IDENTIFICATION PATTERNS:
                        - Look for: "1. Office Chair", "Item: Desk", "Product: Software License"
                        - Table format: "Description | Qty | Unit Price | Total"
                        - List format: "- Office Chair (2 units @ 75,000 each)"
                        
                        TOTAL IDENTIFICATION:
                        - Prioritize: "Total: RWF 407,100" over "Subtotal: RWF 345,000"
                        - Look for: "Grand Total", "Amount Due", "Final Amount", "Total Amount"
                        - Include tax in final total if present
                        
                        Return ONLY valid JSON:
                        {
                            "vendor": "company name from header",
                            "total_amount": "final total as number string",
                            "items": [
                                {
                                    "name": "actual product/service name",
                                    "quantity": number,
                                    "unit_price": "price per unit as string"
                                }
                            ],
                            "terms": "payment terms if found",
                            "confidence": 0.95
                        }
                        
                        EXAMPLE CORRECT EXTRACTION:
                        Input: "Items: 1. Office Chair (2 × 75,000), 2. Desk Lamp (5 × 15,000), Subtotal: 225,000, Tax: 40,500, Total: 265,500"
                        Output: {
                            "items": [
                                {"name": "Office Chair", "quantity": 2, "unit_price": "75000"},
                                {"name": "Desk Lamp", "quantity": 5, "unit_price": "15000"}
                            ],
                            "total_amount": "265500"
                        }"""
                    },
                    {"role": "user", "content": f"Extract data from this proforma invoice. Focus on finding the items section and final total:\n\n{text[:3000]}"}
                ],
                temperature=0.1,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up response
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()
            
            # Parse JSON
            extracted_data = json.loads(content)
            
            # Validate and clean extracted data
            if not isinstance(extracted_data, dict):
                raise ValueError("Invalid JSON structure")
            
            # Enhanced item filtering and validation
            if 'items' in extracted_data:
                filtered_items = []
                for item in extracted_data['items']:
                    if self._is_valid_item(item):
                        filtered_items.append(self._clean_item(item))
                
                extracted_data['items'] = filtered_items
            
            # Validate and clean total amount
            if 'total_amount' in extracted_data:
                extracted_data['total_amount'] = self._clean_amount(extracted_data['total_amount'])
            
            # Ensure required fields exist
            extracted_data.setdefault('vendor', 'Unknown Vendor')
            extracted_data.setdefault('total_amount', '0.00')
            extracted_data.setdefault('items', [])
            extracted_data.setdefault('terms', 'Net 30')
            extracted_data.setdefault('confidence', 0.9)
            
            return extracted_data
            
        except Exception as e:
            print(f"AI extraction failed: {e}")
            # Return enhanced basic extraction with fallback
            basic_data = self._enhanced_basic_extract_proforma(text)
            basic_data['confidence'] = 0.4
            basic_data['processing_method'] = 'enhanced_basic_fallback'
            return basic_data
    
    def _is_valid_item(self, item):
        """Enhanced validation for extracted items"""
        if not isinstance(item, dict):
            return False
        
        name = item.get('name', '').strip()
        quantity = item.get('quantity', 0)
        unit_price = item.get('unit_price', '0')
        
        # Check if name exists and has letters
        if not name or len(name) < 2 or not re.search(r'[a-zA-Z]', name):
            return False
        
        # Exclude non-item keywords
        exclude_keywords = [
            'subtotal', 'total', 'tax', 'vat', 'discount', 'shipping', 
            'handling', 'fee', 'charge', 'due', 'balance', 'amount',
            'grand', 'final', 'sum', 'bill', 'invoice', 'pro-', 'pro ',
            'receipt', 'number', '#', 'ref', 'reference', 'id', 'code'
        ]
        
        if any(keyword in name.lower() for keyword in exclude_keywords):
            return False
        
        # Check quantity range
        try:
            qty = int(quantity)
            if qty <= 0 or qty > 10000:
                return False
        except (ValueError, TypeError):
            return False
        
        # Check unit price
        try:
            price = float(str(unit_price).replace(',', '').replace(' ', ''))
            if price <= 0 or price > 100000000:
                return False
        except (ValueError, TypeError):
            return False
        
        return True
    
    def _clean_item(self, item):
        """Clean and standardize item data"""
        return {
            'name': item.get('name', '').strip(),
            'quantity': int(item.get('quantity', 1)),
            'unit_price': str(item.get('unit_price', '0')).replace(',', '').replace(' ', '')
        }
    
    def _clean_amount(self, amount):
        """Clean and standardize amount string"""
        if not amount:
            return '0.00'
        
        # Remove currency symbols and clean
        cleaned = str(amount).replace(',', '').replace(' ', '').replace('RWF', '').replace('$', '').replace('€', '')
        
        try:
            float(cleaned)
            return cleaned
        except ValueError:
            return '0.00'
    
    def _enhanced_basic_extract_proforma(self, text):
        """Enhanced basic extraction with better item and total detection"""
        items = self._enhanced_extract_items(text)
        total = self._enhanced_extract_amount(text)
        
        return {
            'vendor': self._extract_vendor(text),
            'total_amount': total,
            'items': items,
            'terms': self._extract_terms(text),
            'confidence': 0.7,
            'processing_method': 'enhanced_basic_extraction'
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
    
    def _enhanced_extract_items(self, text):
        """Enhanced item extraction with multiple pattern recognition"""
        items = []
        
        # Look for items sections first
        items_sections = re.findall(r'(?:items?|products?|services?|description|line\s+items?)\s*:?\s*([\s\S]*?)(?:subtotal|total|tax|payment|terms|$)', text, re.IGNORECASE)
        
        if items_sections:
            # Process items from dedicated sections
            for section in items_sections:
                items.extend(self._extract_items_from_section(section))
        else:
            # Fallback to general item extraction
            items = self._extract_items(text)
        
        # Remove duplicates and validate
        unique_items = []
        seen_names = set()
        
        for item in items:
            if self._is_valid_item(item):
                name_key = item['name'].lower().strip()
                if name_key not in seen_names:
                    seen_names.add(name_key)
                    unique_items.append(self._clean_item(item))
        
        return unique_items[:10]  # Limit to 10 items
    
    def _extract_items_from_section(self, section_text):
        """Extract items from a dedicated items section"""
        items = []
        
        # Multiple patterns for different formats
        patterns = [
            # Table format: "1 Office Chair 75,000 150,000"
            r'(\d+)\s+([A-Za-z][^\n\d]*?)\s+(\d+[,\d]*\.?\d*)\s+(\d+[,\d]*\.?\d*)',
            # List format: "1. Office Chair - 2 × 75,000"
            r'\d+\.?\s+([A-Za-z][^\n]*?)\s*[-–—]?\s*(\d+)\s*[×x✕]\s*(\d+[,\d]*\.?\d*)',
            # Simple format: "Office Chair 2 75000"
            r'([A-Za-z][A-Za-z\s]+)\s+(\d+)\s+(\d+[,\d]*\.?\d*)',
            # Quantity first: "2 Office Chair 75000"
            r'(\d+)\s+([A-Za-z][A-Za-z\s]+?)\s+(\d+[,\d]*\.?\d*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, section_text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                try:
                    if len(match) == 4:  # qty, name, unit_price, total
                        qty, name, unit_price, _ = match
                        items.append({
                            'name': name.strip(),
                            'quantity': int(qty),
                            'unit_price': unit_price.replace(',', '')
                        })
                    elif len(match) == 3:
                        # Determine order based on which makes sense
                        if match[0].isdigit() and not match[1].isdigit():
                            # qty, name, price
                            qty, name, price = match
                        elif not match[0].isdigit() and match[1].isdigit():
                            # name, qty, price
                            name, qty, price = match
                        else:
                            continue
                        
                        items.append({
                            'name': name.strip(),
                            'quantity': int(qty),
                            'unit_price': price.replace(',', '')
                        })
                except (ValueError, IndexError):
                    continue
        
        return items
    
    def _enhanced_extract_amount(self, text):
        """Enhanced total amount extraction with priority system"""
        amounts_found = []
        
        # High priority patterns (final totals)
        high_priority_patterns = [
            r'(?:grand\s+total|final\s+total|amount\s+due|total\s+amount)\s*:?\s*(?:rwf\s*)?([0-9,]+\.?[0-9]*)',
            r'total\s*:?\s*(?:rwf\s*)?([0-9,]+\.?[0-9]*)\s*$',  # Total at end of line
        ]
        
        # Medium priority patterns
        medium_priority_patterns = [
            r'total\s*:?\s*(?:rwf\s*)?([0-9,]+\.?[0-9]*)',
            r'(?:rwf|\$|€)\s*([0-9,]+\.?[0-9]*)\s*(?:total|due)',
        ]
        
        # Low priority patterns
        low_priority_patterns = [
            r'amount\s*:?\s*(?:rwf\s*)?([0-9,]+\.?[0-9]*)',
            r'([0-9,]+\.?[0-9]*)\s*(?:rwf|\$|€)\s*$',
        ]
        
        # Process patterns by priority
        for priority, patterns in enumerate([high_priority_patterns, medium_priority_patterns, low_priority_patterns]):
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    try:
                        amount = match.replace(',', '').replace(' ', '')
                        amount_float = float(amount)
                        amounts_found.append((amount_float, amount, priority))
                    except ValueError:
                        continue
        
        if amounts_found:
            # Sort by priority first, then by amount (largest)
            amounts_found.sort(key=lambda x: (x[2], -x[0]))
            return amounts_found[0][1]  # Return the best match
        
        return "0.00"
    
    def _extract_items(self, text):
        # Enhanced item extraction that filters out totals/subtotals
        items = []
        
        # Look for line items with quantity and price patterns
        patterns = [
            r'(\d+)\s+([A-Za-z][^\n]*?)\s+(?:rwf\s*)?([0-9,]+\.?[0-9]*)',  # qty item price
            r'([A-Za-z][^\n]*?)\s+(\d+)\s+(?:rwf\s*)?([0-9,]+\.?[0-9]*)',  # item qty price
            r'(\d+)\s*([A-Za-z][^\n]*?)\s*(?:rwf\s*)?([0-9,]+)',  # Simplified pattern
        ]
        
        # Words to exclude from items (totals, subtotals, invoice headers, etc.)
        exclude_keywords = [
            'subtotal', 'total', 'tax', 'vat', 'discount', 'shipping', 
            'handling', 'fee', 'charge', 'due', 'balance', 'amount',
            'grand', 'final', 'sum', 'bill', 'invoice', 'pro-', 'pro ',
            'receipt', 'number', '#', 'ref', 'reference', 'id', 'code'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches[:10]:  # Limit to 10 items max
                try:
                    if len(match) == 3:
                        # Determine which is qty, name, price based on pattern
                        if match[0].isdigit():
                            qty, name, price = match
                        else:
                            name, qty, price = match
                        
                        # Clean up the name
                        name = name.strip()
                        
                        # Skip if name contains excluded keywords
                        if any(keyword in name.lower() for keyword in exclude_keywords):
                            continue
                        
                        # Skip invoice numbers and headers (additional check)
                        if re.search(r'invoice|pro-|#|receipt|ref', name.lower()):
                            continue
                        
                        # Skip if name is too short or just numbers/symbols
                        if len(name) < 3 or name.isdigit() or not re.search(r'[a-zA-Z]', name):
                            continue
                        
                        # Validate quantity and price
                        if qty.isdigit() and 0 < int(qty) <= 1000:
                            price_clean = price.replace(',', '').replace(' ', '')
                            try:
                                price_float = float(price_clean)
                                if 0 < price_float <= 10000000:  # Reasonable price range
                                    items.append({
                                        'name': name.strip(),
                                        'quantity': int(qty),
                                        'unit_price': price_clean
                                    })
                            except ValueError:
                                continue
                except (ValueError, IndexError):
                    continue
        
        # Remove duplicates based on item name
        seen_names = set()
        unique_items = []
        for item in items:
            name_lower = item['name'].lower()
            if name_lower not in seen_names:
                seen_names.add(name_lower)
                unique_items.append(item)
        
        return unique_items[:5]  # Return max 5 unique items
    
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
        """Validate file for security issues with expanded format support"""
        if hasattr(file_input, 'size') and file_input.size > 15 * 1024 * 1024:  # 15MB limit
            raise ValidationError("File too large. Maximum size is 15MB.")
        
        if hasattr(file_input, 'name'):
            filename = file_input.name.lower()
            allowed_extensions = [
                '.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif',
                '.txt', '.text', '.csv'
            ]
            if not any(filename.endswith(ext) for ext in allowed_extensions):
                raise ValidationError(f"File type not allowed. Supported: {', '.join(allowed_extensions)}")
        
        if hasattr(file_input, 'read'):
            file_input.seek(0)
            file_header = file_input.read(2048)
            file_input.seek(0)
            
            try:
                mime_type = magic.from_buffer(file_header, mime=True)
                allowed_mimes = [
                    'application/pdf', 'image/jpeg', 'image/png', 'image/bmp',
                    'image/tiff', 'image/gif', 'text/plain', 'text/csv'
                ]
                if mime_type not in allowed_mimes:
                    print(f"Warning: MIME type {mime_type} not in allowed list, but proceeding...")
            except Exception as e:
                print(f"MIME type detection failed: {e}")

    def _extract_text_file(self, file_path):
        """Extract text from text files with encoding detection"""
        encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"Error reading text file with {encoding}: {e}")
                continue
        
        raise ValueError("Could not decode text file with any supported encoding")
    
    def _extract_pdf_alternative(self, pdf_path):
        """Alternative PDF extraction method"""
        try:
            import PyPDF2
            text = ""
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Alternative PDF extraction failed: {e}")
            return ""
    
    def _extract_unknown_format(self, file_path):
        """Try multiple extraction methods for unknown formats"""
        # Try as text file first
        try:
            return self._extract_text_file(file_path)
        except:
            pass
        
        # Try as image
        try:
            return self.extract_text_from_image(file_path)
        except:
            pass
        
        # Try as PDF
        try:
            return self.extract_text_from_pdf(file_path)
        except:
            pass
        
        return "Could not extract text from this file format"

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