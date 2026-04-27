from django.conf import settings
from rest_framework import serializers

from .models import Order, Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ("id", "code", "name", "price_cny", "duration_days", "features", "is_active")


class OrderSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "plan",
            "amount_cny",
            "status",
            "provider",
            "out_trade_no",
            "created_at",
            "paid_at",
            "payment_url",
        )
        read_only_fields = fields

    def get_payment_url(self, obj):
        return f"{settings.FRONTEND_BASE_URL}/billing/mock-pay?order={obj.id}"


class OrderCreateSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(pk=value, is_active=True)
        except Plan.DoesNotExist as exc:
            raise serializers.ValidationError("套餐不存在或已下架") from exc
        self.context["plan"] = plan
        return value

    def create(self, validated_data):
        plan = self.context["plan"]
        return Order.objects.create(
            user=self.context["request"].user,
            plan=plan,
            amount_cny=plan.price_cny,
        )
