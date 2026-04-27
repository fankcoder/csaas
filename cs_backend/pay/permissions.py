from rest_framework.permissions import BasePermission

from .services import user_has_premium


class HasActiveSubscription(BasePermission):
    message = "该功能需要登录并拥有有效订阅"

    def has_permission(self, request, view) -> bool:
        return user_has_premium(request.user)
