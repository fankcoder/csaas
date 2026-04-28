from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Order, Plan
from .paypal import PayPalError, approval_url, capture_paypal_order, create_paypal_order, format_paypal_amount
from .serializers import OrderCreateSerializer, OrderSerializer, PlanSerializer, SubscriptionSerializer
from .services import activate_subscription, active_subscription


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

        if order.amount_cny <= Decimal("0"):
            order.provider = "free"
            order.status = Order.Status.PAID
            order.paid_at = timezone.now()
            order.save(update_fields=["provider", "status", "paid_at"])
            activate_subscription(order)
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        try:
            paypal_payload = create_paypal_order(order)
        except PayPalError as exc:
            order.status = Order.Status.CLOSED
            order.paypal_status = "create_failed"
            order.provider_payload = {"error": str(exc)}
            order.save(update_fields=["status", "paypal_status", "provider_payload"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        order.paypal_order_id = paypal_payload.get("id", "")
        order.paypal_status = paypal_payload.get("status", "")
        order.paypal_checkout_url = approval_url(paypal_payload)
        order.provider_payload = paypal_payload
        order.save(
            update_fields=[
                "paypal_order_id",
                "paypal_status",
                "paypal_checkout_url",
                "provider_payload",
            ]
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def mock_paid(self, request, pk=None):
        if not settings.PAYPAL_ENABLE_MOCK_PAYMENTS:
            return Response({"detail": "Mock payments are disabled."}, status=status.HTTP_403_FORBIDDEN)
        order = self.get_object()
        order.status = Order.Status.PAID
        order.paid_at = timezone.now()
        order.save(update_fields=["status", "paid_at"])
        activate_subscription(order)
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="paypal-capture")
    def paypal_capture(self, request, pk=None):
        order = self.get_object()
        if order.status == Order.Status.PAID:
            return Response(OrderSerializer(order).data)

        paypal_order_id = request.data.get("paypal_order_id") or request.data.get("token") or order.paypal_order_id
        if not paypal_order_id:
            return Response({"detail": "Missing PayPal order id."}, status=status.HTTP_400_BAD_REQUEST)
        if order.paypal_order_id and paypal_order_id != order.paypal_order_id:
            return Response({"detail": "PayPal order id does not match this order."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            paypal_payload = capture_paypal_order(paypal_order_id)
        except PayPalError as exc:
            order.paypal_status = "capture_failed"
            order.provider_payload = {"error": str(exc)}
            order.save(update_fields=["paypal_status", "provider_payload"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        capture = (
            paypal_payload.get("purchase_units", [{}])[0]
            .get("payments", {})
            .get("captures", [{}])[0]
        )
        order.paypal_order_id = paypal_payload.get("id", order.paypal_order_id)
        order.paypal_capture_id = capture.get("id", "")
        order.paypal_status = capture.get("status") or paypal_payload.get("status", "")
        order.provider_payload = paypal_payload

        captured_amount = capture.get("amount", {})
        if order.paypal_status == "COMPLETED" and (
            captured_amount.get("currency_code") != settings.PAYPAL_CURRENCY
            or captured_amount.get("value") != format_paypal_amount(order.amount_cny)
        ):
            order.paypal_status = "amount_mismatch"
            order.save(
                update_fields=[
                    "paypal_order_id",
                    "paypal_capture_id",
                    "paypal_status",
                    "provider_payload",
                ]
            )
            return Response({"detail": "PayPal payment amount did not match this order."}, status=status.HTTP_400_BAD_REQUEST)

        if paypal_payload.get("status") == "COMPLETED" and order.paypal_status == "COMPLETED":
            order.status = Order.Status.PAID
            order.paid_at = timezone.now()
            order.save(
                update_fields=[
                    "status",
                    "paid_at",
                    "paypal_order_id",
                    "paypal_capture_id",
                    "paypal_status",
                    "provider_payload",
                ]
            )
            activate_subscription(order)
            return Response(OrderSerializer(order).data)

        order.save(
            update_fields=[
                "paypal_order_id",
                "paypal_capture_id",
                "paypal_status",
                "provider_payload",
            ]
        )
        return Response({"detail": "PayPal payment was not completed."}, status=status.HTTP_400_BAD_REQUEST)


class CurrentSubscriptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def list(self, request, *args, **kwargs):
        subscription = active_subscription(request.user)
        if not subscription:
            return Response({"active": False, "subscription": None})
        return Response({"active": True, "subscription": SubscriptionSerializer(subscription).data})
