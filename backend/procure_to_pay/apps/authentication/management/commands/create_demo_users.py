from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create demo users for testing'

    def handle(self, *args, **options):
        users_data = [
            {
                'username': 'staff1',
                'email': 'staff1@example.com',
                'password': 'password123',
                'role': 'staff',
                'first_name': 'John',
                'last_name': 'Staff'
            },
            {
                'username': 'approver1',
                'email': 'approver1@example.com',
                'password': 'password123',
                'role': 'approver_level_1',
                'first_name': 'Jane',
                'last_name': 'Approver1'
            },
            {
                'username': 'approver2',
                'email': 'approver2@example.com',
                'password': 'password123',
                'role': 'approver_level_2',
                'first_name': 'Bob',
                'last_name': 'Approver2'
            },
            {
                'username': 'finance1',
                'email': 'finance1@example.com',
                'password': 'password123',
                'role': 'finance',
                'first_name': 'Alice',
                'last_name': 'Finance'
            }
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.username} ({user.role})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {user.username}')
                )