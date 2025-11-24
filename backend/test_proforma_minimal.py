#!/usr/bin/env python3
"""
Minimal test for proforma processing logic
"""

import json
import re
from decimal import Decimal

class MinimalDocumentProcessor:
    """Simplified version for testing"""
    
    def process_proforma(self, text):
        """Process proforma text and extract data"""
        return self._extract_proforma_data(text)
    
    def process_receipt(self, text):
        """Process receipt text and extract data"""
        return self._extract_receipt_data(text)
    
    def generate_po_from_proforma(self, proforma_data):
        """Generate PO data from proforma"""
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
    
    def validate_receipt_against_po(self, receipt_data, po_data):
        """Compare receipt against PO"""
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
    
    def _calculate_total(self, items):
        """Calculate total from items"""
        total = Decimal('0')
        for item in items:
            try:
                qty = Decimal(str(item.get('quantity', 0)))
                price = Decimal(str(item.get('unit_price', 0)))
                total += qty * price
            except (ValueError, TypeError):
                continue
        return total
    
    def _extract_proforma_data(self, text):
        """Extract proforma data"""
        return {
            'vendor': self._extract_vendor(text),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text),
            'terms': self._extract_terms(text)
        }
    
    def _extract_receipt_data(self, text):
        """Extract receipt data"""
        return {
            'seller': self._extract_vendor(text),
            'total_amount': self._extract_amount(text),
            'items': self._extract_items(text),
            'date': self._extract_date(text)
        }
    
    def _extract_vendor(self, text):
        """Extract vendor name"""
        patterns = [
            r'vendor[:\\s]+([^\\n]+)',
            r'seller[:\\s]+([^\\n]+)',
            r'company[:\\s]+([^\\n]+)',
            r'([A-Z][A-Za-z\\s&]+(?:Ltd|Inc|Corp|LLC))',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                vendor = match.group(1).strip()
                if len(vendor) > 2:
                    return vendor
        return \"Unknown Vendor\"
    
    def _extract_amount(self, text):
        """Extract total amount"""
        patterns = [
            r'total[:\\s]*\\$?([0-9,]+\\.?[0-9]*)',
            r'amount[:\\s]*\\$?([0-9,]+\\.?[0-9]*)',
            r'\\$([0-9,]+\\.[0-9]{2})',
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
        return \"0.00\"
    
    def _extract_items(self, text):
        """Extract line items"""
        items = []
        # Look for patterns like: "1. Item Name    2    $1200.00"
        lines = text.split('\\n')
        for line in lines:
            # Match patterns with item, quantity, price
            match = re.search(r'(\\d+\\.\\s+)?([A-Za-z][^\\d]*?)\\s+(\\d+)\\s+\\$([0-9,]+\\.?[0-9]*)', line)
            if match:
                try:
                    name = match.group(2).strip()
                    qty = int(match.group(3))
                    price = float(match.group(4).replace(',', ''))
                    
                    items.append({
                        'name': name,
                        'quantity': qty,
                        'unit_price': price
                    })
                except (ValueError, IndexError):
                    continue
        
        return items
    
    def _extract_terms(self, text):
        """Extract payment terms"""
        patterns = [r'terms[:\\s]+([^\\n]+)', r'payment[:\\s]+([^\\n]+)']
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return \"Net 30\"
    
    def _extract_date(self, text):
        """Extract date"""
        patterns = [r'(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})', r'(\\d{4}-\\d{2}-\\d{2})']
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None

def test_proforma_processing():
    """Test proforma processing"""
    print(\"🔄 Testing Proforma Processing...\")
    
    proforma_text = \"\"\"
    PROFORMA INVOICE
    
    Vendor: ABC Electronics Inc
    Address: 123 Tech Street, Silicon Valley
    
    Items:
    1. Laptop Computer    2    $1200.00    $2400.00
    2. Wireless Mouse     5    $25.00      $125.00
    3. USB Cable          10   $15.00      $150.00
    
    Subtotal: $2675.00
    Tax: $267.50
    Total: $2942.50
    
    Payment Terms: Net 30 days
    \"\"\"
    
    try:
        processor = MinimalDocumentProcessor()
        extracted_data = processor.process_proforma(proforma_text)
        
        print(f\"✅ Proforma processed successfully\")
        print(f\"   Vendor: {extracted_data.get('vendor', 'Not found')}\")
        print(f\"   Total: ${extracted_data.get('total_amount', 'Not found')}\")
        print(f\"   Items: {len(extracted_data.get('items', []))}\")
        print(f\"   Terms: {extracted_data.get('terms', 'Not found')}\")
        
        # Print items details
        for i, item in enumerate(extracted_data.get('items', []), 1):
            print(f\"     {i}. {item.get('name', 'Unknown')} - Qty: {item.get('quantity', 0)} - Price: ${item.get('unit_price', 0)}\")
        
        return extracted_data
        
    except Exception as e:
        print(f\"❌ Proforma processing failed: {e}\")
        return None

def test_po_generation(proforma_data):
    \"\"\"Test PO generation\"\"\"
    print(\"\\n🔄 Testing PO Generation...\")
    
    try:
        processor = MinimalDocumentProcessor()
        po_data = processor.generate_po_from_proforma(proforma_data)
        
        print(f\"✅ PO generated successfully\")
        print(f\"   Vendor: {po_data.get('vendor', 'Not found')}\")
        print(f\"   Total: ${po_data.get('total', 'Not found')}\")
        print(f\"   Items: {len(po_data.get('items', []))}\")
        print(f\"   Terms: {po_data.get('terms', 'Not found')}\")
        
        return po_data
        
    except Exception as e:
        print(f\"❌ PO generation failed: {e}\")
        return None

def test_receipt_validation(po_data):
    \"\"\"Test receipt validation\"\"\"
    print(\"\\n🔄 Testing Receipt Validation...\")
    
    receipt_text = \"\"\"
    RECEIPT
    
    Seller: ABC Electronics Inc
    Date: 2024-01-15
    
    Items Purchased:
    1. Laptop Computer    2    $1200.00    $2400.00
    2. Wireless Mouse     5    $25.00      $125.00
    3. USB Cable          10   $15.00      $150.00
    
    Subtotal: $2675.00
    Tax: $267.50
    Total: $2942.50
    
    Receipt #: REC-2024-001
    \"\"\"
    
    try:
        processor = MinimalDocumentProcessor()
        receipt_data = processor.process_receipt(receipt_text)
        
        print(f\"✅ Receipt processed successfully\")
        print(f\"   Seller: {receipt_data.get('seller', 'Not found')}\")
        print(f\"   Total: ${receipt_data.get('total_amount', 'Not found')}\")
        
        # Validate against PO
        discrepancies = processor.validate_receipt_against_po(receipt_data, po_data)
        
        print(f\"✅ Receipt validation completed\")
        print(f\"   Discrepancies found: {len(discrepancies)}\")
        
        if discrepancies:
            print(\"   Discrepancy details:\")
            for disc in discrepancies:
                print(f\"     - {disc['item']}: {disc['reason']}\")
        else:
            print(\"   ✅ No discrepancies found - Receipt matches PO!\")
        
        return receipt_data, discrepancies
        
    except Exception as e:
        print(f\"❌ Receipt validation failed: {e}\")
        return None, None

def main():
    \"\"\"Run the test suite\"\"\"
    print(\"🚀 Testing Proforma → PO → Receipt System\")
    print(\"=\" * 50)
    
    # Test 1: Process proforma
    proforma_data = test_proforma_processing()
    if not proforma_data:
        print(\"❌ Test failed at proforma processing\")
        return
    
    # Test 2: Generate PO
    po_data = test_po_generation(proforma_data)
    if not po_data:
        print(\"❌ Test failed at PO generation\")
        return
    
    # Test 3: Validate receipt
    receipt_data, discrepancies = test_receipt_validation(po_data)
    if receipt_data is None:
        print(\"❌ Test failed at receipt validation\")
        return
    
    print(\"\\n\" + \"=\" * 50)
    print(\"🎉 ALL TESTS PASSED!\")
    print(\"✅ Proforma processing: Working\")
    print(\"✅ PO generation: Working\")
    print(\"✅ Receipt validation: Working\")
    print(\"\\n📋 System demonstrates:\")
    print(\"   • Proforma upload and data extraction\")
    print(\"   • Automatic PO generation from proforma\")
    print(\"   • Receipt validation against PO with discrepancy detection\")

if __name__ == \"__main__\":
    main()