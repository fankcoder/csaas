import uuid

from django.conf import settings
from django.db import models


class Plan(models.Model):
    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=80)
    price_cny = models.DecimalField(max_digits=8, decimal_places=2)
    duration_days = models.PositiveIntegerField(default=30)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("sort", "price_cny")

    def __str__(self) -> str:
        return self.name


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "待支付"
        PAID = "paid", "已支付"
        CLOSED = "closed", "已关闭"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pay_orders")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="orders")
    amount_cny = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider = models.CharField(max_length=30, default="mock")
    out_trade_no = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    paypal_order_id = models.CharField(max_length=64, blank=True, db_index=True)
    paypal_capture_id = models.CharField(max_length=64, blank=True)
    paypal_status = models.CharField(max_length=40, blank=True)
    paypal_checkout_url = models.URLField(blank=True)
    provider_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.out_trade_no} {self.status}"


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "生效中"
        CANCELED = "canceled", "已取消"
        EXPIRED = "expired", "已过期"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    order = models.OneToOneField(Order, on_delete=models.SET_NULL, related_name="subscription", blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    canceled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-current_period_end",)
        indexes = [
            models.Index(fields=["user", "status", "current_period_end"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} {self.plan} {self.status}"
