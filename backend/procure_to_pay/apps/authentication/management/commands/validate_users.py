from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from collections import defaultdict

User = get_user_model()

class Command(BaseCommand):
    help = 'Validate user uniqueness constraints'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting user validation...'))
        
        # Check email uniqueness
        self.check_email_uniqueness()
        
        # Check username uniqueness
        self.check_username_uniqueness()
        
        # Check password uniqueness
        self.check_password_uniqueness()
        
        self.stdout.write(self.style.SUCCESS('User validation completed'))
    
    def check_email_uniqueness(self):
        self.stdout.write('\n--- Checking Email Uniqueness ---')
        email_counts = defaultdict(list)
        
        for user in User.objects.all():
            email_counts[user.email.lower()].append(user)
        
        duplicates_found = False
        for email, users in email_counts.items():
            if len(users) > 1:
                duplicates_found = True
                self.stdout.write(
                    self.style.ERROR(f'Duplicate email "{email}": {[u.username for u in users]}')
                )
        
        if not duplicates_found:
            self.stdout.write(self.style.SUCCESS('✓ All emails are unique'))
    
    def check_username_uniqueness(self):
        self.stdout.write('\n--- Checking Username Uniqueness ---')
        username_counts = defaultdict(list)
        
        for user in User.objects.all():
            username_counts[user.username.lower()].append(user)
        
        duplicates_found = False
        for username, users in username_counts.items():
            if len(users) > 1:
                duplicates_found = True
                self.stdout.write(
                    self.style.ERROR(f'Duplicate username "{username}": {[u.email for u in users]}')
                )
        
        if not duplicates_found:
            self.stdout.write(self.style.SUCCESS('✓ All usernames are unique'))
    
    def check_password_uniqueness(self):
        self.stdout.write('\n--- Checking Password Uniqueness ---')
        users = list(User.objects.all())
        duplicates_found = False
        
        for i, user1 in enumerate(users):
            for user2 in users[i+1:]:
                if check_password(user1.password, user2.password) or check_password(user2.password, user1.password):
                    duplicates_found = True
                    self.stdout.write(
                        self.style.ERROR(f'Duplicate password: {user1.username} and {user2.username}')
                    )
        
        if not duplicates_found:
            self.stdout.write(self.style.SUCCESS('✓ All passwords are unique'))
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Attempt to fix duplicate issues by deleting duplicates',
        )