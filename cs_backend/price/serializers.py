from rest_framework import serializers

from .models import ArbitrageOpportunity, Iteminfo, Price
from .services import build_quotes, opportunity_rows


class IteminfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iteminfo
        fields = (
            "id",
            "appid",
            "name",
            "market_hash_name",
            "market_name_cn",
            "icon_url",
            "quality",
            "quality_color",
            "collection",
            "collection_url",
            "category",
        )


class MarketQuoteSerializer(serializers.Serializer):
    platform = serializers.CharField()
    label = serializers.CharField()
    group = serializers.CharField()
    price_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    source_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    source_currency = serializers.CharField()
    volume = serializers.IntegerField()
    sell_fee = serializers.DecimalField(max_digits=5, decimal_places=4)


class PriceSerializer(serializers.ModelSerializer):
    iteminfo = IteminfoSerializer()
    quotes = serializers.SerializerMethodField()

    class Meta:
        model = Price
        fields = (
            "id",
            "iteminfo",
            "buff_id",
            "buff_buy_price",
            "buff_buy_num",
            "buff_sell_price",
            "buff_sell_num",
            "buff_time",
            "steam_price",
            "steam_price_cny",
            "steam_time",
            "wax_price",
            "wax_time",
            "wax_count",
            "shadow_price",
            "shadow_time",
            "shadow_sell_num",
            "stock",
            "star",
            "profit",
            "card_price",
            "wax_avg_sells",
            "c5_price",
            "ig_price",
            "uu_price",
            "quotes",
        )

    def get_quotes(self, obj):
        return MarketQuoteSerializer(build_quotes(obj), many=True).data


class ArbitrageOpportunitySerializer(serializers.Serializer):
    iteminfo_id = serializers.IntegerField()
    market_hash_name = serializers.CharField()
    market_name_cn = serializers.CharField(allow_null=True, required=False)
    icon_url = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    quality = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    quality_color = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    category = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    buy_platform = serializers.CharField()
    buy_platform_label = serializers.CharField()
    buy_group = serializers.CharField()
    buy_price_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    buy_source_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    buy_source_currency = serializers.CharField()
    buy_volume = serializers.IntegerField()
    sell_platform = serializers.CharField()
    sell_platform_label = serializers.CharField()
    sell_group = serializers.CharField()
    sell_price_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    sell_source_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    sell_source_currency = serializers.CharField()
    sell_volume = serializers.IntegerField()
    sell_fee_rate = serializers.DecimalField(max_digits=5, decimal_places=4)
    sell_net_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    margin_pct = serializers.DecimalField(max_digits=8, decimal_places=2)
    buff_time = serializers.DateTimeField(allow_null=True, required=False)
    wax_time = serializers.DateTimeField(allow_null=True, required=False)
    shadow_time = serializers.DateField(allow_null=True, required=False)


class StoredArbitrageOpportunitySerializer(serializers.ModelSerializer):
    iteminfo_id = serializers.IntegerField(source="iteminfo.id")
    market_hash_name = serializers.CharField(source="iteminfo.market_hash_name")
    market_name_cn = serializers.CharField(source="iteminfo.market_name_cn", allow_null=True)
    icon_url = serializers.CharField(source="iteminfo.icon_url", allow_blank=True, allow_null=True)
    quality = serializers.CharField(source="iteminfo.quality", allow_blank=True, allow_null=True)
    quality_color = serializers.CharField(source="iteminfo.quality_color", allow_blank=True, allow_null=True)
    category = serializers.CharField(source="iteminfo.category", allow_blank=True, allow_null=True)

    buy_platform = serializers.CharField(source="direction_a_platform")
    buy_platform_label = serializers.CharField(source="direction_a_platform_label")
    buy_group = serializers.CharField(source="direction_a_group")
    buy_price_cny = serializers.DecimalField(source="direction_a_price_cny", max_digits=12, decimal_places=2)
    buy_source_price = serializers.DecimalField(source="direction_a_source_price", max_digits=12, decimal_places=2)
    buy_source_currency = serializers.CharField(source="direction_a_source_currency")
    buy_volume = serializers.IntegerField(source="direction_a_volume")

    sell_platform = serializers.CharField(source="direction_b_platform")
    sell_platform_label = serializers.CharField(source="direction_b_platform_label")
    sell_group = serializers.CharField(source="direction_b_group")
    sell_price_cny = serializers.DecimalField(source="direction_b_price_cny", max_digits=12, decimal_places=2)
    sell_source_price = serializers.DecimalField(source="direction_b_source_price", max_digits=12, decimal_places=2)
    sell_source_currency = serializers.CharField(source="direction_b_source_currency")
    sell_volume = serializers.IntegerField(source="direction_b_volume")
    sell_fee_rate = serializers.DecimalField(source="direction_b_fee_rate", max_digits=6, decimal_places=4)
    sell_net_cny = serializers.DecimalField(source="direction_b_net_cny", max_digits=12, decimal_places=2)

    class Meta:
        model = ArbitrageOpportunity
        fields = (
            "id",
            "iteminfo_id",
            "market_hash_name",
            "market_name_cn",
            "icon_url",
            "quality",
            "quality_color",
            "category",
            "buy_platform",
            "buy_platform_label",
            "buy_group",
            "buy_price_cny",
            "buy_source_price",
            "buy_source_currency",
            "buy_volume",
            "sell_platform",
            "sell_platform_label",
            "sell_group",
            "sell_price_cny",
            "sell_source_price",
            "sell_source_currency",
            "sell_volume",
            "sell_fee_rate",
            "sell_net_cny",
            "profit_cny",
            "margin_pct",
            "usd_cny_rate",
            "min_volume",
            "calculation_batch_id",
            "calculated_at",
        )


class PriceOpportunitySerializer(serializers.ModelSerializer):
    iteminfo = IteminfoSerializer()
    opportunities = serializers.SerializerMethodField()

    class Meta:
        model = Price
        fields = ("id", "iteminfo", "opportunities")

    def get_opportunities(self, obj):
        rows = opportunity_rows(obj)
        return ArbitrageOpportunitySerializer(rows, many=True).data
