from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('staff', 'Staff'),
        ('approver_level_1', 'Approver Level 1'),
        ('approver_level_2', 'Approver Level 2'),
        ('finance', 'Finance'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    department = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"