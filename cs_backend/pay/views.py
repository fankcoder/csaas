from django.conf import settings
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Order, Plan
from .serializers import OrderCreateSerializer, OrderSerializer, PlanSerializer


class PlanViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = PlanSerializer
    queryset = Plan.objects.filter(is_active=True)


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("plan")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def mock_paid(self, request, pk=None):
        order = self.get_object()
        if not settings.DEBUG and not request.user.is_staff:
            return Response({"detail": "仅开发环境或管理员可使用模拟支付"}, status=status.HTTP_403_FORBIDDEN)
        order.status = Order.Status.PAID
        order.paid_at = timezone.now()
        order.save(update_fields=["status", "paid_at"])
        return Response(OrderSerializer(order).data)
