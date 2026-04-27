import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("pay", "Plan")
    plans = [
        {
            "code": "starter",
            "name": "Starter",
            "price_cny": "99.00",
            "duration_days": 30,
            "features": ["套利榜单", "基础筛选", "每日刷新"],
            "sort": 10,
        },
        {
            "code": "pro",
            "name": "Pro",
            "price_cny": "299.00",
            "duration_days": 30,
            "features": ["实时监控", "高级筛选", "API 访问", "订阅提醒"],
            "sort": 20,
        },
    ]
    for plan in plans:
        Plan.objects.update_or_create(code=plan["code"], defaults=plan)


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.SlugField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=80)),
                ("price_cny", models.DecimalField(decimal_places=2, max_digits=8)),
                ("duration_days", models.PositiveIntegerField(default=30)),
                ("features", models.JSONField(blank=True, default=list)),
                ("is_active", models.BooleanField(default=True)),
                ("sort", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ("sort", "price_cny")},
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount_cny", models.DecimalField(decimal_places=2, max_digits=8)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "待支付"), ("paid", "已支付"), ("closed", "已关闭")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("provider", models.CharField(default="mock", max_length=30)),
                ("out_trade_no", models.CharField(default=uuid.uuid4, max_length=64, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                (
                    "plan",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orders", to="pay.plan"),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pay_orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.RunPython(seed_plans, migrations.RunPython.noop),
    ]
