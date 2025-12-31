#!/usr/bin/env python3
"""
Migrate existing files to database storage
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings.local')
django.setup()

from procure_to_pay.apps.requests.models import PurchaseRequest

def migrate_files():
    print("🔄 Migrating existing files to database storage...")
    
    requests = PurchaseRequest.objects.all()
    migrated_count = 0
    
    for request in requests:
        updated = False
        
        # Migrate proforma
        if request.proforma and not request.proforma_content:
            try:
                if hasattr(request.proforma, 'path') and os.path.exists(request.proforma.path):
                    with open(request.proforma.path, 'rb') as f:
                        request.proforma_content = f.read()
                        request.proforma_filename = os.path.basename(request.proforma.name)
                        request.proforma_content_type = 'application/pdf'
                        updated = True
                        print(f"✅ Migrated proforma for request {request.id}")
            except Exception as e:
                print(f"❌ Failed to migrate proforma for request {request.id}: {e}")
        
        # Migrate purchase order
        if request.purchase_order and not request.purchase_order_content:
            try:
                if hasattr(request.purchase_order, 'path') and os.path.exists(request.purchase_order.path):
                    with open(request.purchase_order.path, 'rb') as f:
                        request.purchase_order_content = f.read()
                        request.purchase_order_filename = os.path.basename(request.purchase_order.name)
                        updated = True
                        print(f"✅ Migrated PO for request {request.id}")
            except Exception as e:
                print(f"❌ Failed to migrate PO for request {request.id}: {e}")
        
        # Migrate receipt
        if request.receipt and not request.receipt_content:
            try:
                if hasattr(request.receipt, 'path') and os.path.exists(request.receipt.path):
                    with open(request.receipt.path, 'rb') as f:
                        request.receipt_content = f.read()
                        request.receipt_filename = os.path.basename(request.receipt.name)
                        request.receipt_content_type = 'application/pdf'
                        updated = True
                        print(f"✅ Migrated receipt for request {request.id}")
            except Exception as e:
                print(f"❌ Failed to migrate receipt for request {request.id}: {e}")
        
        if updated:
            request.save()
            migrated_count += 1
    
    print(f"🎉 Migration complete! Updated {migrated_count} requests")

if __name__ == "__main__":
    migrate_files()