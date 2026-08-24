from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import FinancialDocument, ComplianceAlert, Budget
from .serializers import FinancialDocumentSerializer, ComplianceAlertSerializer, BudgetSerializer
from ..requests.models import PurchaseRequest
import csv
from io import StringIO

@extend_schema_view(
    list=extend_schema(description="List all department budgets (Finance only)", tags=['Budgets']),
    create=extend_schema(description="Set a monthly spend limit for a department (Finance only)", tags=['Budgets']),
    retrieve=extend_schema(description="Get a single department's budget (Finance only)", tags=['Budgets']),
    update=extend_schema(description="Update a department's budget (Finance only)", tags=['Budgets']),
    partial_update=extend_schema(description="Partially update a department's budget (Finance only)", tags=['Budgets']),
    destroy=extend_schema(description="Delete a department's budget (Finance only)", tags=['Budgets']),
)
class BudgetViewSet(viewsets.ModelViewSet):
    """Finance-only management of per-department monthly spend limits."""
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Budget.objects.none()
        if self.request.user.role != 'finance':
            return Budget.objects.none()
        return Budget.objects.all()

    def _check_finance(self, request):
        if request.user.role != 'finance':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def create(self, request, *args, **kwargs):
        denied = self._check_finance(request)
        return denied if denied else super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        denied = self._check_finance(request)
        return denied if denied else super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._check_finance(request)
        return denied if denied else super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        denied = self._check_finance(request)
        return denied if denied else super().destroy(request, *args, **kwargs)

    @extend_schema(description="Spend vs. budget for every department with a budget set", tags=['Budgets'])
    @action(detail=False, methods=['get'])
    def status_report(self, request):
        denied = self._check_finance(request)
        if denied:
            return denied

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        report = []
        for budget in Budget.objects.all():
            spent = PurchaseRequest.objects.filter(
                created_by__department=budget.department,
                status='approved',
                created_at__gte=month_start,
            ).aggregate(total=Sum('amount'))['total'] or 0
            limit = budget.monthly_limit
            report.append({
                'department': budget.department,
                'monthly_limit': float(limit),
                'spent': float(spent),
                'percentage_used': round(float(spent) / float(limit) * 100, 1) if limit else 0,
            })

        return Response(report)

class FinancialDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'finance':
            return FinancialDocument.objects.none()
        return FinancialDocument.objects.all()
    
    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        if file_obj:
            file_obj.seek(0)
            serializer.save(
                uploaded_by=self.request.user,
                file_content=file_obj.read(),
                filename=file_obj.name,
                content_type=file_obj.content_type,
                file_size=file_obj.size
            )
    
    @extend_schema(description="Download financial document")
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        response = HttpResponse(document.file_content, content_type=document.content_type)
        response['Content-Disposition'] = f'attachment; filename="{document.filename}"'
        return response
    
    @extend_schema(description="Export financial reports as CSV")
    @action(detail=False, methods=['get'])
    def export_financial_report(self, request):
        """Export comprehensive financial report"""
        requests = PurchaseRequest.objects.select_related('created_by').all()
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Title', 'Amount', 'Status', 'Created By', 'Created At', 'Department'])
        
        for req in requests:
            writer.writerow([
                req.title,
                req.amount,
                req.status,
                req.created_by.get_full_name() or req.created_by.username,
                req.created_at.strftime('%Y-%m-%d'),
                req.created_by.department or 'N/A'
            ])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="financial_report.csv"'
        return response

class ComplianceAlertViewSet(viewsets.ModelViewSet):
    serializer_class = ComplianceAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role not in ['finance', 'approver_level_1', 'approver_level_2']:
            return ComplianceAlert.objects.none()
        return ComplianceAlert.objects.filter(is_active=True)
    
    @extend_schema(description="Generate compliance alerts")
    @action(detail=False, methods=['post'])
    def generate_alerts(self, request):
        if request.user.role != 'finance':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        alerts_created = 0
        
        # High value requests (>100,000 RWF)
        high_value_requests = PurchaseRequest.objects.filter(
            amount__gt=100000,
            status='pending'
        ).exclude(
            compliancealert__alert_type='high_value',
            compliancealert__is_active=True
        )
        
        for request_obj in high_value_requests:
            ComplianceAlert.objects.create(
                alert_type='high_value',
                severity='high',
                title=f'High Value Request: {request_obj.title}',
                description=f'Request #{request_obj.id} has a value of RWF {request_obj.amount:,}',
                request=request_obj
            )
            alerts_created += 1
        
        # Overdue reviews (pending for >7 days)
        overdue_date = timezone.now() - timedelta(days=7)
        overdue_requests = PurchaseRequest.objects.filter(
            status='pending',
            created_at__lt=overdue_date
        ).exclude(
            compliancealert__alert_type='overdue_review',
            compliancealert__is_active=True
        )
        
        for request_obj in overdue_requests:
            days_overdue = (timezone.now() - request_obj.created_at).days
            ComplianceAlert.objects.create(
                alert_type='overdue_review',
                severity='medium' if days_overdue < 14 else 'high',
                title=f'Overdue Review: {request_obj.title}',
                description=f'Request #{request_obj.id} has been pending for {days_overdue} days',
                request=request_obj
            )
            alerts_created += 1

        # Budget exceeded (current month spend on approved requests vs. each department's limit)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for budget in Budget.objects.all():
            spent = PurchaseRequest.objects.filter(
                created_by__department=budget.department,
                status='approved',
                created_at__gte=month_start,
            ).aggregate(total=Sum('amount'))['total'] or 0

            if spent <= budget.monthly_limit:
                continue

            already_alerted = ComplianceAlert.objects.filter(
                alert_type='budget_exceeded',
                is_active=True,
                title=f'Budget Exceeded: {budget.department}',
            ).exists()
            if already_alerted:
                continue

            ComplianceAlert.objects.create(
                alert_type='budget_exceeded',
                severity='high',
                title=f'Budget Exceeded: {budget.department}',
                description=(
                    f'{budget.department} has spent RWF {spent:,.0f} this month, '
                    f'exceeding its budget of RWF {budget.monthly_limit:,.0f}'
                ),
            )
            alerts_created += 1

        return Response({
            'message': f'{alerts_created} alerts generated',
            'alerts_created': alerts_created
        })
    
    @extend_schema(description="Resolve compliance alert")
    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_active = False
        alert.resolved_at = timezone.now()
        alert.resolved_by = request.user
        alert.save()
        
        return Response({'message': 'Alert resolved successfully'})
    
    @extend_schema(description="Get alert statistics")
    @action(detail=False, methods=['get'])
    def stats(self, request):
        alerts = self.get_queryset()
        
        stats = {
            'total_active': alerts.count(),
            'by_type': dict(alerts.values('alert_type').annotate(count=Count('id')).values_list('alert_type', 'count')),
            'by_severity': dict(alerts.values('severity').annotate(count=Count('id')).values_list('severity', 'count')),
            'high_value_count': alerts.filter(alert_type='high_value').count(),
            'overdue_count': alerts.filter(alert_type='overdue_review').count()
        }
        
        return Response(stats)
    
    @extend_schema(description="Get finance dashboard statistics")
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get comprehensive dashboard statistics for finance users"""
        if request.user.role != 'finance':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        requests = PurchaseRequest.objects.all()
        total_value = requests.aggregate(Sum('amount'))['amount__sum'] or 0
        request_count = requests.count()

        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        current_month_value = requests.filter(
            created_at__gte=current_month_start
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        last_month_value = requests.filter(
            created_at__gte=last_month_start, created_at__lt=current_month_start
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        if last_month_value > 0:
            monthly_growth = ((current_month_value - last_month_value) / last_month_value) * 100
        elif current_month_value > 0:
            monthly_growth = 100
        else:
            monthly_growth = 0

        stats = {
            'total_requests': request_count,
            'total_value': float(total_value),
            'pending_requests': requests.filter(status='pending').count(),
            'approved_requests': requests.filter(status='approved').count(),
            'rejected_requests': requests.filter(status='rejected').count(),
            'high_value_requests': requests.filter(amount__gt=100000).count(),
            'total_alerts': ComplianceAlert.objects.count(),
            'active_alerts': ComplianceAlert.objects.filter(is_active=True).count(),
            'avg_request_value': float(total_value / request_count) if request_count > 0 else 0,
            'monthly_growth': round(float(monthly_growth), 1)
        }

        return Response(stats)