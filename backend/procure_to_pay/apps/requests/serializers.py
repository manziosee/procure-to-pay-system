from rest_framework import serializers
from .models import PurchaseRequest, Approval

class PurchaseRequestSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approvals = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseRequest
        fields = ['id', 'title', 'description', 'amount', 'status', 'created_by', 
                 'created_by_name', 'created_at', 'updated_at', 'proforma', 
                 'purchase_order', 'receipt', 'approvals']
        read_only_fields = ['created_by', 'status', 'purchase_order']
    
    def get_approvals(self, obj):
        return ApprovalSerializer(obj.approvals.all(), many=True).data

class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    
    class Meta:
        model = Approval
        fields = ['id', 'approver', 'approver_name', 'approved', 'comments', 'created_at']
        read_only_fields = ['approver']