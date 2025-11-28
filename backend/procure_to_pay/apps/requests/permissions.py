from rest_framework.permissions import BasePermission

class CanApproveRequest(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['approver_level_1', 'approver_level_2']

class CanUpdateRequest(BasePermission):
    def has_object_permission(self, request, view, obj):
        return (request.user == obj.created_by and 
                obj.status == 'pending' and 
                request.user.role == 'staff')