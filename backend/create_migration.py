#!/usr/bin/env python3
"""
Create migration for document storage fields
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procure_to_pay.settings.local')
django.setup()

from django.core.management import execute_from_command_line

if __name__ == "__main__":
    execute_from_command_line(['manage.py', 'makemigrations', 'requests', '--name', 'add_document_storage'])