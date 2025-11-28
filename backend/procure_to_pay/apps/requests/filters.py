import django_filters
from django.db.models import Q
from .models import PurchaseRequest

class PurchaseRequestFilter(django_filters.FilterSet):
    """Advanced filtering for purchase requests"""
    
    status = django_filters.ChoiceFilter(choices=PurchaseRequest.STATUS_CHOICES)
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = PurchaseRequest
        fields = ['status', 'amount_min', 'amount_max', 'created_after', 'created_before']
    
    def filter_search(self, queryset, name, value):
        """Search across title and description"""
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )