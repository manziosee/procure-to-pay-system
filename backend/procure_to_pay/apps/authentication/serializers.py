from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from .models import User
import uuid

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.CharField()

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'department', 'password', 'password_confirm')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.lower()

    def validate_password(self, value):
        # Basic password strength validation
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Note: Password uniqueness check disabled for performance and stability
        # In production, consider implementing this with a background job
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Map role display names to role values
        role_mapping = {
            'Finance Team': 'finance',
            'Staff': 'staff',
            'Approver Level 1': 'approver_level_1',
            'Approver Level 2': 'approver_level_2'
        }
        
        if attrs['role'] in role_mapping:
            attrs['role'] = role_mapping[attrs['role']]
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        # Generate unique username from email if not provided
        if 'username' not in validated_data or not validated_data['username']:
            base_username = validated_data['email'].split('@')[0].lower()
            username = base_username
            counter = 1
            
            # Ensure username is unique
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            validated_data['username'] = username
        
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'department')
        read_only_fields = ('id', 'username', 'email')