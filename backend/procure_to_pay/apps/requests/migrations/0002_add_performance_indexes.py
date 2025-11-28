# Generated migration for performance indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('requests', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requests_status_created ON requests_purchaserequest(status, created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_requests_status_created;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requests_created_by_status ON requests_purchaserequest(created_by_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_requests_created_by_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requests_amount ON requests_purchaserequest(amount);",
            reverse_sql="DROP INDEX IF EXISTS idx_requests_amount;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests_purchaserequest(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_requests_created_at;"
        ),
    ]