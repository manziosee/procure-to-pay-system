from rest_framework import serializers
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.CharField()

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'department', 'password', 'password_confirm')

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
        # Generate username from email if not provided
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email'].split('@')[0]
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'department')