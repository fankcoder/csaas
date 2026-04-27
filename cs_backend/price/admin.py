from django.contrib import admin

from .models import ArbitrageOpportunity, Iteminfo, Price


@admin.register(Iteminfo)
class IteminfoAdmin(admin.ModelAdmin):
    list_display = ("id", "market_hash_name", "market_name_cn", "category", "quality")
    search_fields = ("market_hash_name", "market_name_cn", "name")
    list_filter = ("category", "quality")


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    list_display = ("id", "iteminfo", "buff_sell_price", "buff_sell_num", "wax_price", "wax_count")
    search_fields = ("iteminfo__market_hash_name", "iteminfo__market_name_cn")


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
