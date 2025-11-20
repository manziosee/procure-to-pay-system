from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentProcessing',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('proforma', 'Proforma'), ('purchase_order', 'Purchase Order'), ('receipt', 'Receipt')], max_length=20)),
                ('file', models.FileField(upload_to='documents/')),
                ('extracted_data', models.JSONField(default=dict)),
                ('processed_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]