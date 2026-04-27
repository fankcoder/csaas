from django.conf import settings
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
    card_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wax_avg_sells = models.IntegerField(blank=True, null=True, default=0)
    c5_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    ig_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    uu_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    uu_time = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "price"

    def __str__(self) -> str:
        return str(self.iteminfo) if self.iteminfo else f"Price#{self.pk}"


class PriceSnapshot(models.Model):
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.CASCADE, related_name="price_snapshots")
    platform = models.CharField(max_length=32)
    platform_label = models.CharField(max_length=64)
    price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    source_price = models.DecimalField(max_digits=12, decimal_places=2)
    source_currency = models.CharField(max_length=8)
    volume = models.IntegerField(default=0)
    source_updated_at = models.DateTimeField(blank=True, null=True)
    captured_at = models.DateTimeField()
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "price_snapshot"
        constraints = [
            models.UniqueConstraint(
                fields=("iteminfo", "platform", "captured_at"),
                name="uniq_price_snapshot_item_platform_time",
            )
        ]
        indexes = [
            models.Index(fields=["iteminfo", "platform", "captured_at"]),
            models.Index(fields=["platform", "captured_at"]),
            models.Index(fields=["iteminfo", "-captured_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.iteminfo_id}:{self.platform}:{self.price_cny}@{self.captured_at}"


class ItemPlatformListing(models.Model):
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.CASCADE, related_name="platform_listings")
    platform = models.CharField(max_length=32)
    platform_item_id = models.CharField(max_length=80)
    source_name = models.CharField(max_length=128, blank=True, null=True)
    imported_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "item_platform_listing"
        constraints = [
            models.UniqueConstraint(fields=("iteminfo", "platform"), name="uniq_item_platform_listing")
        ]
        indexes = [
            models.Index(fields=["platform", "platform_item_id"]),
            models.Index(fields=["platform"]),
        ]

    def __str__(self) -> str:
        return f"{self.iteminfo} {self.platform}:{self.platform_item_id}"


class ArbitrageOpportunity(models.Model):
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.CASCADE, related_name="arbitrage_opportunities")

    direction_a_platform = models.CharField(max_length=32)
    direction_a_platform_label = models.CharField(max_length=64)
    direction_a_group = models.CharField(max_length=32)
    direction_a_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    direction_a_source_price = models.DecimalField(max_digits=12, decimal_places=2)
    direction_a_source_currency = models.CharField(max_length=8)
    direction_a_volume = models.IntegerField(default=0)
    direction_a_quotes = models.JSONField(default=list, blank=True)

    direction_b_platform = models.CharField(max_length=32)
    direction_b_platform_label = models.CharField(max_length=64)
    direction_b_group = models.CharField(max_length=32)
    direction_b_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    direction_b_source_price = models.DecimalField(max_digits=12, decimal_places=2)
    direction_b_source_currency = models.CharField(max_length=8)
    direction_b_volume = models.IntegerField(default=0)
    direction_b_fee_rate = models.DecimalField(max_digits=6, decimal_places=4)
    direction_b_net_cny = models.DecimalField(max_digits=12, decimal_places=2)
    direction_b_quotes = models.JSONField(default=list, blank=True)

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


class OpportunityFavorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="opportunity_favorites")
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.CASCADE, related_name="opportunity_favorites")
    direction_a_platform = models.CharField(max_length=32)
    direction_b_platform = models.CharField(max_length=32)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "opportunity_favorite"
        constraints = [
            models.UniqueConstraint(
                fields=("user", "iteminfo", "direction_a_platform", "direction_b_platform"),
                name="uniq_user_opportunity_favorite",
            )
        ]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
            models.Index(fields=["iteminfo", "direction_a_platform", "direction_b_platform"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.user_id}:{self.iteminfo_id} "
            f"{self.direction_a_platform}->{self.direction_b_platform}"
        )


class TradeRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trade_records")
    iteminfo = models.ForeignKey(Iteminfo, on_delete=models.PROTECT, related_name="trade_records")
    direction_a_platform = models.CharField(max_length=32)
    direction_b_platform = models.CharField(max_length=32)
    buy_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    sell_price_cny = models.DecimalField(max_digits=12, decimal_places=2)
    sell_fee_cny = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_cost_cny = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)
    realized_profit_cny = models.DecimalField(max_digits=12, decimal_places=2)
    traded_at = models.DateTimeField()
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trade_record"
        indexes = [
            models.Index(fields=["user", "-traded_at"]),
            models.Index(fields=["iteminfo", "-traded_at"]),
            models.Index(fields=["direction_a_platform", "direction_b_platform"]),
        ]

    def save(self, *args, **kwargs):
        self.realized_profit_cny = (
            (self.sell_price_cny - self.buy_price_cny - self.sell_fee_cny - self.other_cost_cny)
            * self.quantity
        )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.iteminfo_id}:{self.realized_profit_cny}"
