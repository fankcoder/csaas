from django.contrib import admin

from .models import (
    ArbitrageOpportunity,
    ItemPlatformListing,
    Iteminfo,
    OpportunityFavorite,
    Price,
    PriceSnapshot,
    TradeRecord,
)


@admin.register(Iteminfo)
class IteminfoAdmin(admin.ModelAdmin):
    list_display = ("id", "market_hash_name", "market_name_cn", "category", "quality")
    search_fields = ("market_hash_name", "market_name_cn", "name")
    list_filter = ("category", "quality")


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    list_display = ("id", "iteminfo", "buff_sell_price", "buff_sell_num", "wax_price", "wax_count")
    search_fields = ("iteminfo__market_hash_name", "iteminfo__market_name_cn")


@admin.register(PriceSnapshot)
class PriceSnapshotAdmin(admin.ModelAdmin):
    list_display = ("id", "iteminfo", "platform", "price_cny", "volume", "source_updated_at", "captured_at")
    list_filter = ("platform", "captured_at")
    search_fields = ("iteminfo__market_hash_name", "iteminfo__market_name_cn")
    ordering = ("-captured_at",)


@admin.register(ItemPlatformListing)
class ItemPlatformListingAdmin(admin.ModelAdmin):
    list_display = ("id", "iteminfo", "platform", "platform_item_id", "imported_at")
    list_filter = ("platform",)
    search_fields = ("iteminfo__market_hash_name", "iteminfo__market_name_cn", "platform_item_id")


@admin.register(ArbitrageOpportunity)
class ArbitrageOpportunityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "iteminfo",
        "direction_a_platform",
        "direction_b_platform",
        "profit_cny",
        "margin_pct",
        "calculated_at",
    )
    search_fields = ("iteminfo__market_hash_name", "iteminfo__market_name_cn")
    list_filter = ("direction_a_platform", "direction_b_platform", "calculated_at")
    ordering = ("-profit_cny",)


@admin.register(OpportunityFavorite)
class OpportunityFavoriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "iteminfo", "direction_a_platform", "direction_b_platform", "updated_at")
    search_fields = ("user__username", "user__email", "iteminfo__market_hash_name", "iteminfo__market_name_cn")
    list_filter = ("direction_a_platform", "direction_b_platform")


@admin.register(TradeRecord)
class TradeRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "iteminfo",
        "direction_a_platform",
        "direction_b_platform",
        "quantity",
        "realized_profit_cny",
        "traded_at",
    )
    search_fields = ("user__username", "user__email", "iteminfo__market_hash_name", "iteminfo__market_name_cn")
    list_filter = ("direction_a_platform", "direction_b_platform", "traded_at")
    ordering = ("-traded_at",)
