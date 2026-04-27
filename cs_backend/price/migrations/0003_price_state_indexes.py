from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("price", "0002_manage_price_tables"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="price",
                    name="iteminfo",
                    field=models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="price.iteminfo",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="iteminfo",
            index=models.Index(fields=["market_hash_name"], name="iteminfo_market__acfe85_idx"),
        ),
        migrations.AddIndex(
            model_name="iteminfo",
            index=models.Index(fields=["category"], name="iteminfo_categor_4d1590_idx"),
        ),
    ]
