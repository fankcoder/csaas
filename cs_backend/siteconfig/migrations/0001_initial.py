from django.db import migrations, models


def seed_defaults(apps, schema_editor):
    SiteSetting = apps.get_model("siteconfig", "SiteSetting")
    SiteSetting.objects.update_or_create(
        key="market",
        defaults={
            "value": {
                "usd_cny_rate": "7.25",
                "fees": {"buff": "0.025", "waxpeer": "0.07", "shadowpay": "0.05"},
            },
            "description": "默认市场汇率和手续费配置",
            "is_public": True,
        },
    )


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=80, unique=True)),
                ("value", models.JSONField(blank=True, default=dict)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("is_public", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("key",)},
        ),
        migrations.RunPython(seed_defaults, migrations.RunPython.noop),
    ]
