from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password

User = get_user_model()

class Command(BaseCommand):
    help = 'Create demo users for testing with unique passwords'

    def handle(self, *args, **options):
        try:
            self.create_users()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Demo users creation failed: {e}'))
    
    def create_users(self):
        # Clear existing demo users to avoid conflicts
        User.objects.filter(email__endswith='@example.com').delete()
        self.stdout.write(self.style.SUCCESS('Cleared existing demo users'))
        
        users_data = [
            {
                'username': 'staff1',
                'email': 'staff1@example.com',
                'password': 'StaffPass123!',  # Unique password
                'role': 'staff',
                'first_name': 'John',
                'last_name': 'Staff',
                'department': 'Operations'
            },
            {
                'username': 'approver1',
                'email': 'approver1@example.com',
                'password': 'Approve1Pass456@',  # Unique password
                'role': 'approver_level_1',
                'first_name': 'Jane',
                'last_name': 'Approver1',
                'department': 'Management'
            },
            {
                'username': 'approver2',
                'email': 'approver2@example.com',
                'password': 'Approve2Pass789#',  # Unique password
                'role': 'approver_level_2',
                'first_name': 'Bob',
                'last_name': 'Approver2',
                'department': 'Executive'
            },
            {
                'username': 'finance1',
                'email': 'finance1@example.com',
                'password': 'FinancePass101$',  # Unique password
                'role': 'finance',
                'first_name': 'Alice',
                'last_name': 'Finance',
                'department': 'Finance'
            }
        ]

        for user_data in users_data:
            # Validate uniqueness before creation
            if User.objects.filter(username__iexact=user_data['username']).exists():
                self.stdout.write(
                    self.style.ERROR(f'Username {user_data["username"]} already exists')
                )
                continue
                
            if User.objects.filter(email__iexact=user_data['email']).exists():
                self.stdout.write(
                    self.style.ERROR(f'Email {user_data["email"]} already exists')
                )
                continue
            
            # Check password uniqueness
            password_exists = False
            for existing_user in User.objects.all():
                if check_password(user_data['password'], existing_user.password):
                    password_exists = True
                    break
            
            if password_exists:
                self.stdout.write(
                    self.style.ERROR(f'Password for {user_data["username"]} is already in use')
                )
                continue
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                department=user_data['department']
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created user: {user.username} ({user.role}) - {user.email}')
            )
        
        self.stdout.write(self.style.SUCCESS('Demo users setup completed with unique credentials'))