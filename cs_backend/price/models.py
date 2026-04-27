from django.db import models
from django.utils.translation import gettext_lazy as _


class Iteminfo(models.Model):
    appid = models.CharField(max_length=8, blank=True, null=True)
    name = models.CharField(max_length=128, blank=True, null=True)
    market_hash_name = models.CharField(max_length=128)
    market_name_cn = models.CharField(max_length=128, blank=True, null=True)
    icon_url = models.CharField(max_length=512, blank=True, null=True)
    quality = models.CharField(max_length=64, blank=True, null=True)
    quality_color = models.CharField(max_length=32, blank=True, null=True)
    collection = models.CharField(max_length=64, blank=True, null=True)
    collection_url = models.CharField(max_length=512, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "iteminfo"
        indexes = [
            models.Index(fields=["market_hash_name"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return self.market_name_cn or self.market_hash_name


class Price(models.Model):
    iteminfo = models.OneToOneField(Iteminfo, models.DO_NOTHING, blank=True, null=True)
    buff_id = models.IntegerField(blank=True, null=True)
    buff_buy_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    buff_buy_num = models.IntegerField(blank=True, null=True)
    buff_sell_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    buff_sell_num = models.IntegerField(blank=True, null=True)
    buff_time = models.DateTimeField(blank=True, null=True)
    steam_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    steam_price_cny = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    steam_time = models.DateTimeField(blank=True, null=True)
    wax_price = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    wax_time = models.DateTimeField(blank=True, null=True)
    wax_count = models.IntegerField(blank=True, null=True)
    shadow_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    shadow_time = models.DateField(blank=True, null=True)
    shadow_sell_num = models.IntegerField(blank=True, null=True)
    stock = models.IntegerField(blank=True, null=True, default=0)
    star = models.BooleanField(blank=True, null=True)
    cent = models.FloatField(_("cent"), default=0)
    profit = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    card_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wax_avg_sells = models.IntegerField(blank=True, null=True, default=0)
    c5_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    ig_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    uu_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = "price"

    def __str__(self) -> str:
        return str(self.iteminfo) if self.iteminfo else f"Price#{self.pk}"


class ArbitrageOpportunity(models.Model):
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.CASCADE, related_name="arbitrage_opportunities")

    direction_a_platform = models.CharField(max_length=32)
    direction_a_platform_label = models.CharField(max_length=64)
    direction_a_group = models.CharField(max_length=32)
    direction_a_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    direction_a_source_price = models.DecimalField(max_digits=12, decimal_places=2)
    direction_a_source_currency = models.CharField(max_length=8)
    direction_a_volume = models.IntegerField(default=0)

    direction_b_platform = models.CharField(max_length=32)
    direction_b_platform_label = models.CharField(max_length=64)
    direction_b_group = models.CharField(max_length=32)
    direction_b_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    direction_b_source_price = models.DecimalField(max_digits=12, decimal_places=2)
    direction_b_source_currency = models.CharField(max_length=8)
    direction_b_volume = models.IntegerField(default=0)
    direction_b_fee_rate = models.DecimalField(max_digits=6, decimal_places=4)
    direction_b_net_cny = models.DecimalField(max_digits=12, decimal_places=2)

    profit_cny = models.DecimalField(max_digits=12, decimal_places=2)
    margin_pct = models.DecimalField(max_digits=8, decimal_places=2)
    usd_cny_rate = models.DecimalField(max_digits=8, decimal_places=4)
    min_volume = models.IntegerField(default=1)
    calculation_batch_id = models.CharField(max_length=36)
    calculated_at = models.DateTimeField()

    class Meta:
        db_table = "arbitrage_opportunity"
        constraints = [
            models.UniqueConstraint(
                fields=("iteminfo", "direction_a_platform", "direction_b_platform"),
                name="uniq_arbitrage_item_direction",
            )
        ]
        indexes = [
            models.Index(fields=["-profit_cny"]),
            models.Index(fields=["direction_a_platform", "direction_b_platform"]),
            models.Index(fields=["calculated_at"]),
            models.Index(fields=["margin_pct"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.iteminfo} {self.direction_a_platform_label}"
            f" -> {self.direction_b_platform_label}: {self.profit_cny}"
        )
