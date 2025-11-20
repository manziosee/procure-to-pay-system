from rest_framework import serializers
from .models import PurchaseRequest, Approval, RequestItem

class RequestItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestItem
        fields = ['id', 'name', 'description', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']

class PurchaseRequestSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approvals = serializers.SerializerMethodField()
    items = RequestItemSerializer(many=True, required=False)
    
    class Meta:
        model = PurchaseRequest
        fields = ['id', 'title', 'description', 'amount', 'status', 'created_by', 
                 'created_by_name', 'created_at', 'updated_at', 'proforma', 
                 'purchase_order', 'receipt', 'approvals', 'items', 'proforma_data',
                 'receipt_data', 'validation_results']
        read_only_fields = ['created_by', 'status', 'purchase_order', 'proforma_data',
                           'receipt_data', 'validation_results']
    
    def get_approvals(self, obj):
        return ApprovalSerializer(obj.approvals.all(), many=True).data
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = PurchaseRequest.objects.create(**validated_data)
        
        for item_data in items_data:
            RequestItem.objects.create(request=request, **item_data)
        
        return request
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance = super().update(instance, validated_data)
        
        if items_data:
            instance.items.all().delete()
            for item_data in items_data:
                RequestItem.objects.create(request=instance, **item_data)
        
        return instance

class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    
    class Meta:
        model = Approval
        fields = ['id', 'approver', 'approver_name', 'approved', 'comments', 'created_at']
        read_only_fields = ['approver']