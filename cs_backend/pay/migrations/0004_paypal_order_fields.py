from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("pay", "0003_update_pricing_plans"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="paypal_order_id",
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name="order",
            name="paypal_capture_id",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name="order",
            name="paypal_status",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="order",
            name="paypal_checkout_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="order",
            name="provider_payload",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
