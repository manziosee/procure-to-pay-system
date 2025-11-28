from django.contrib import admin
from .models import PurchaseRequest, Approval

@admin.register(PurchaseRequest)
class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ('request', 'approver', 'approved', 'created_at')
    list_filter = ('approved', 'created_at')
    readonly_fields = ('created_at',)