from django.db import migrations


def update_pricing_plans(apps, schema_editor):
    Plan = apps.get_model("pay", "Plan")
    plans = [
        {
            "code": "free",
            "name": "Free",
            "price_cny": "0.00",
            "duration_days": 30,
            "features": ["Top 5 deals", "Hourly refresh", "Basic market data"],
            "is_active": True,
            "sort": 10,
        },
        {
            "code": "pro",
            "name": "Pro",
            "price_cny": "29.00",
            "duration_days": 30,
            "features": ["All deals", "30 min refresh", "90 days analytics"],
            "is_active": True,
            "sort": 20,
        },
        {
            "code": "elite",
            "name": "Elite",
            "price_cny": "79.00",
            "duration_days": 30,
            "features": ["Real-time alerts", "Exports", "API access", "365 days history"],
            "is_active": True,
            "sort": 30,
        },
    ]
    active_codes = [plan["code"] for plan in plans]
    Plan.objects.exclude(code__in=active_codes).update(is_active=False)
    for plan in plans:
        Plan.objects.update_or_create(code=plan["code"], defaults=plan)


class Migration(migrations.Migration):
    dependencies = [
        ("pay", "0002_subscription"),
    ]

    operations = [
        migrations.RunPython(update_pricing_plans, migrations.RunPython.noop),
    ]
