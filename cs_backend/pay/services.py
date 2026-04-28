from __future__ import annotations

from django.utils import timezone

from .models import Order, Subscription


def active_subscription(user):
    if not user or not user.is_authenticated:
        return None
    return (
        Subscription.objects.filter(
            user=user,
            status=Subscription.Status.ACTIVE,
            current_period_end__gt=timezone.now(),
        )
        .select_related("plan")
        .order_by("-current_period_end")
        .first()
    )


def user_has_premium(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    return active_subscription(user) is not None


def activate_subscription(order: Order) -> Subscription:
    existing = Subscription.objects.filter(order=order).select_related("plan").first()
    if existing:
        return existing

    now = timezone.now()
    end = now + timezone.timedelta(days=order.plan.duration_days)
    Subscription.objects.filter(user=order.user, status=Subscription.Status.ACTIVE).update(
        status=Subscription.Status.CANCELED,
        canceled_at=now,
    )
    return Subscription.objects.create(
        user=order.user,
        plan=order.plan,
        order=order,
        status=Subscription.Status.ACTIVE,
        current_period_start=now,
        current_period_end=end,
    )


def serialize_subscription(user) -> dict | None:
    subscription = active_subscription(user)
    if not subscription:
        return None
    return {
        "id": subscription.id,
        "plan_code": subscription.plan.code,
        "plan_name": subscription.plan.name,
        "status": subscription.status,
        "current_period_start": subscription.current_period_start,
        "current_period_end": subscription.current_period_end,
    }
