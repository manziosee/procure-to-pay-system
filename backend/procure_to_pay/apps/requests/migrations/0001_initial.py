from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PurchaseRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0)])),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('proforma', models.FileField(blank=True, null=True, upload_to='proformas/')),
                ('purchase_order', models.FileField(blank=True, null=True, upload_to='purchase_orders/')),
                ('receipt', models.FileField(blank=True, null=True, upload_to='receipts/')),
                ('proforma_data', models.JSONField(blank=True, default=dict)),
                ('receipt_data', models.JSONField(blank=True, default=dict)),
                ('validation_results', models.JSONField(blank=True, default=dict)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='RequestItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0)])),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0)])),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='requests.purchaserequest')),
            ],
        ),
        migrations.CreateModel(
            name='Approval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('approved', models.BooleanField()),
                ('comments', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('approver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvals', to='requests.purchaserequest')),
            ],
        ),
        migrations.AddField(
            model_name='purchaserequest',
            name='approved_by',
            field=models.ManyToManyField(related_name='approved_requests', through='requests.Approval', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='approval',
            unique_together={('request', 'approver')},
        ),
    ]