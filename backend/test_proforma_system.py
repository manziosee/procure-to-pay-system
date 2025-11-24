#!/usr/bin/env python3
"""
Test script for the Proforma Upload → PO Generation → Receipt Validation system
"""

import os
import sys
import django
import tempfile
from decimal import Decimal

# Setup Django
sys.path.append('/home/manzi/Project/procure-to-pay-system/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings')
django.setup()

from django.contrib.auth.models import User
from procure_to_pay.apps.documents.models import Proforma, PurchaseOrder, Receipt
from procure_to_pay.apps.documents.services import DocumentProcessor

def create_test_proforma_file():
    """Create a test proforma file"""
    content = """
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
    """
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write(content)
    temp_file.close()
    return temp_file.name

def create_test_receipt_file():
    """Create a test receipt file"""
    content = """
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
    """
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write(content)
    temp_file.close()
    return temp_file.name

def test_proforma_processing():
    """Test proforma upload and processing"""
    print("🔄 Testing Proforma Processing...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Create test proforma file
    proforma_file = create_test_proforma_file()
    
    try:
        # Initialize processor
        processor = DocumentProcessor()
        
        # Process proforma
        extracted_data = processor.process_proforma(proforma_file)
        print(f"✅ Proforma processed successfully")
        print(f"   Vendor: {extracted_data.get('vendor', 'Not found')}")
        print(f"   Total: ${extracted_data.get('total_amount', 'Not found')}")
        print(f"   Items: {len(extracted_data.get('items', []))}")
        
        # Create proforma record
        with open(proforma_file, 'rb') as f:
            proforma = Proforma.objects.create(
                vendor_name=extracted_data.get('vendor', ''),
                extracted_data=extracted_data,
                uploaded_by=user
            )
        
        print(f"✅ Proforma record created with ID: {proforma.id}")
        return proforma, extracted_data
        
    except Exception as e:
        print(f"❌ Proforma processing failed: {e}")
        return None, None
    finally:
        # Cleanup
        if os.path.exists(proforma_file):
            os.unlink(proforma_file)

def test_po_generation(proforma, proforma_data):
    """Test PO generation from proforma"""
    print("\n🔄 Testing PO Generation...")
    
    try:
        processor = DocumentProcessor()
        
        # Generate PO data
        po_data = processor.generate_po_from_proforma(proforma_data)
        
        if not po_data:
            print("❌ Failed to generate PO data")
            return None
        
        # Create PO record
        po = PurchaseOrder.objects.create(
            vendor=po_data['vendor'],
            items=po_data['items'],
            terms=po_data['terms'],
            total=po_data['total'],
            proforma=proforma
        )
        
        print(f"✅ PO generated successfully")
        print(f"   PO ID: {po.id}")
        print(f"   Vendor: {po.vendor}")
        print(f"   Total: ${po.total}")
        print(f"   Items: {len(po.items)}")
        
        return po
        
    except Exception as e:
        print(f"❌ PO generation failed: {e}")
        return None

def test_receipt_validation(po):
    """Test receipt validation against PO"""
    print("\n🔄 Testing Receipt Validation...")
    
    # Create test receipt file
    receipt_file = create_test_receipt_file()
    
    try:
        processor = DocumentProcessor()
        
        # Process receipt
        receipt_data = processor.process_receipt(receipt_file)
        print(f"✅ Receipt processed successfully")
        print(f"   Seller: {receipt_data.get('seller', 'Not found')}")
        print(f"   Total: ${receipt_data.get('total_amount', 'Not found')}")
        
        # Validate against PO
        discrepancies = processor.validate_receipt_against_po(
            receipt_data,
            {'items': po.items, 'vendor': po.vendor}
        )
        
        # Create receipt record
        user = User.objects.get(username='testuser')
        with open(receipt_file, 'rb') as f:
            receipt = Receipt.objects.create(
                extracted_data=receipt_data,
                po=po,
                discrepancies=discrepancies,
                uploaded_by=user
            )
        
        print(f"✅ Receipt validation completed")
        print(f"   Receipt ID: {receipt.id}")
        print(f"   Discrepancies found: {len(discrepancies)}")
        
        if discrepancies:
            print("   Discrepancy details:")
            for disc in discrepancies:
                print(f"     - {disc['item']}: {disc['reason']}")
        else:
            print("   ✅ No discrepancies found - Receipt matches PO!")
        
        return receipt
        
    except Exception as e:
        print(f"❌ Receipt validation failed: {e}")
        return None
    finally:
        # Cleanup
        if os.path.exists(receipt_file):
            os.unlink(receipt_file)

def main():
    """Run complete test suite"""
    print("🚀 Starting Proforma → PO → Receipt Validation Test Suite")
    print("=" * 60)
    
    # Test 1: Proforma Processing
    proforma, proforma_data = test_proforma_processing()
    if not proforma:
        print("❌ Test suite failed at proforma processing")
        return
    
    # Test 2: PO Generation
    po = test_po_generation(proforma, proforma_data)
    if not po:
        print("❌ Test suite failed at PO generation")
        return
    
    # Test 3: Receipt Validation
    receipt = test_receipt_validation(po)
    if not receipt:
        print("❌ Test suite failed at receipt validation")
        return
    
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED!")
    print(f"✅ Proforma ID: {proforma.id}")
    print(f"✅ PO ID: {po.id}")
    print(f"✅ Receipt ID: {receipt.id}")
    print("\n📊 System Summary:")
    print(f"   Total Proformas: {Proforma.objects.count()}")
    print(f"   Total POs: {PurchaseOrder.objects.count()}")
    print(f"   Total Receipts: {Receipt.objects.count()}")

if __name__ == "__main__":
    main()