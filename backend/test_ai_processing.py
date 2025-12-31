#!/usr/bin/env python3
"""
Test AI document processing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings.local')
django.setup()

from procure_to_pay.apps.documents.services import DocumentProcessor

def test_ai_processing():
    print("🤖 Testing AI Document Processing")
    print("=" * 50)
    
    processor = DocumentProcessor()
    
    # Check if OpenAI client is initialized
    if processor.client:
        print("✅ OpenAI client initialized successfully")
    else:
        print("❌ OpenAI client not initialized - check API key")
        return
    
    # Test with sample proforma text
    sample_text = """
    PROFORMA INVOICE
    
    ABC Supplies Ltd
    123 Business Street
    Kigali, Rwanda
    
    Date: 2024-01-15
    Invoice #: PRO-2024-001
    
    Items:
    1. Office Chair - Quantity: 2 - Unit Price: RWF 75,000
    2. Desk Lamp - Quantity: 5 - Unit Price: RWF 15,000
    3. Filing Cabinet - Quantity: 1 - Unit Price: RWF 120,000
    
    Total: RWF 407,100
    Payment Terms: Net 30 days
    """
    
    try:
        print("\n🔍 Processing sample proforma...")
        result = processor._ai_extract_proforma(sample_text)
        
        print("✅ AI Processing successful!")
        print(f"📊 Extracted data:")
        print(f"   Vendor: {result.get('vendor', 'N/A')}")
        print(f"   Total: {result.get('total_amount', 'N/A')}")
        print(f"   Items: {len(result.get('items', []))} items")
        print(f"   Confidence: {result.get('confidence', 'N/A')}")
        
        if result.get('items'):
            print("   Item details:")
            for i, item in enumerate(result['items'][:3], 1):
                print(f"     {i}. {item.get('name', 'N/A')} - Qty: {item.get('quantity', 'N/A')} - Price: {item.get('unit_price', 'N/A')}")
        
    except Exception as e:
        print(f"❌ AI Processing failed: {e}")
        
        # Test fallback processing
        print("\n🔄 Testing fallback processing...")
        try:
            result = processor._basic_extract_proforma(sample_text)
            print("✅ Fallback processing successful!")
            print(f"📊 Fallback data:")
            print(f"   Vendor: {result.get('vendor', 'N/A')}")
            print(f"   Total: {result.get('total_amount', 'N/A')}")
            print(f"   Items: {len(result.get('items', []))} items")
        except Exception as fallback_error:
            print(f"❌ Fallback processing also failed: {fallback_error}")

if __name__ == "__main__":
    test_ai_processing()