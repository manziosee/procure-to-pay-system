#!/usr/bin/env python3
"""
Simple test for proforma processing without Django setup
"""

import sys
import os
import tempfile

# Add the backend directory to Python path
sys.path.append('/home/manzi/Project/procure-to-pay-system/backend')

# Import the DocumentProcessor directly
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
    """Test proforma processing"""
    print("🔄 Testing Proforma Processing...")
    
    proforma_file = create_test_proforma_file()
    
    try:
        processor = DocumentProcessor()
        extracted_data = processor.process_proforma(proforma_file)
        
        print(f"✅ Proforma processed successfully")
        print(f"   Vendor: {extracted_data.get('vendor', 'Not found')}")
        print(f"   Total: ${extracted_data.get('total_amount', 'Not found')}")
        print(f"   Items: {len(extracted_data.get('items', []))}")
        print(f"   Terms: {extracted_data.get('terms', 'Not found')}")
        
        return extracted_data
        
    except Exception as e:
        print(f"❌ Proforma processing failed: {e}")
        return None
    finally:
        if os.path.exists(proforma_file):
            os.unlink(proforma_file)

def test_po_generation(proforma_data):
    """Test PO generation"""
    print("\n🔄 Testing PO Generation...")
    
    try:
        processor = DocumentProcessor()
        po_data = processor.generate_po_from_proforma(proforma_data)
        
        print(f"✅ PO generated successfully")
        print(f"   Vendor: {po_data.get('vendor', 'Not found')}")
        print(f"   Total: ${po_data.get('total', 'Not found')}")
        print(f"   Items: {len(po_data.get('items', []))}")
        print(f"   Terms: {po_data.get('terms', 'Not found')}")
        
        return po_data
        
    except Exception as e:
        print(f"❌ PO generation failed: {e}")
        return None

def test_receipt_validation(po_data):
    """Test receipt validation"""
    print("\n🔄 Testing Receipt Validation...")
    
    receipt_file = create_test_receipt_file()
    
    try:
        processor = DocumentProcessor()
        receipt_data = processor.process_receipt(receipt_file)
        
        print(f"✅ Receipt processed successfully")
        print(f"   Seller: {receipt_data.get('seller', 'Not found')}")
        print(f"   Total: ${receipt_data.get('total_amount', 'Not found')}")
        
        # Validate against PO
        discrepancies = processor.validate_receipt_against_po(
            receipt_data,
            po_data
        )
        
        print(f"✅ Receipt validation completed")
        print(f"   Discrepancies found: {len(discrepancies)}")
        
        if discrepancies:
            print("   Discrepancy details:")
            for disc in discrepancies:
                print(f"     - {disc['item']}: {disc['reason']}")
        else:
            print("   ✅ No discrepancies found - Receipt matches PO!")
        
        return receipt_data, discrepancies
        
    except Exception as e:
        print(f"❌ Receipt validation failed: {e}")
        return None, None
    finally:
        if os.path.exists(receipt_file):
            os.unlink(receipt_file)

def main():
    """Run the test suite"""
    print("🚀 Testing Proforma → PO → Receipt System")
    print("=" * 50)
    
    # Test 1: Process proforma
    proforma_data = test_proforma_processing()
    if not proforma_data:
        print("❌ Test failed at proforma processing")
        return
    
    # Test 2: Generate PO
    po_data = test_po_generation(proforma_data)
    if not po_data:
        print("❌ Test failed at PO generation")
        return
    
    # Test 3: Validate receipt
    receipt_data, discrepancies = test_receipt_validation(po_data)
    if receipt_data is None:
        print("❌ Test failed at receipt validation")
        return
    
    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED!")
    print("✅ Proforma processing: Working")
    print("✅ PO generation: Working")
    print("✅ Receipt validation: Working")

if __name__ == "__main__":
    main()