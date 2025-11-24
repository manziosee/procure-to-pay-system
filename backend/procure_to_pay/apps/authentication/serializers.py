from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from ..requests.security import InputSanitizer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'department', 'password', 'password_confirm']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Sanitize text fields
        attrs['first_name'] = InputSanitizer.sanitize_text(attrs.get('first_name', ''), 50)
        attrs['last_name'] = InputSanitizer.sanitize_text(attrs.get('last_name', ''), 50)
        attrs['department'] = InputSanitizer.sanitize_text(attrs.get('department', ''), 100)
        
        # Validate email
        validate_email(attrs['email'])
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            attrs['user'] = user
        return attrs