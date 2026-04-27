from rest_framework import serializers

from .models import ArbitrageOpportunity, Iteminfo, OpportunityFavorite, Price, PriceSnapshot, TradeRecord
from .services import build_quotes, enrich_quote_payloads, iso_datetime, opportunity_quality_payload, opportunity_rows


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
    last_updated_at = serializers.SerializerMethodField()

    def get_last_updated_at(self, obj):
        return iso_datetime(getattr(obj, "last_updated_at", None))


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
    buy_group_label = serializers.CharField(required=False)
    buy_price_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    buy_source_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    buy_source_currency = serializers.CharField()
    buy_volume = serializers.IntegerField()
    buy_quotes = serializers.JSONField(required=False)
    sell_platform = serializers.CharField()
    sell_platform_label = serializers.CharField()
    sell_group = serializers.CharField()
    sell_group_label = serializers.CharField(required=False)
    sell_price_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    sell_source_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    sell_source_currency = serializers.CharField()
    sell_volume = serializers.IntegerField()
    sell_quotes = serializers.JSONField(required=False)
    sell_fee_rate = serializers.DecimalField(max_digits=5, decimal_places=4)
    sell_net_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit_cny = serializers.DecimalField(max_digits=12, decimal_places=2)
    margin_pct = serializers.DecimalField(max_digits=8, decimal_places=2)
    liquidity_score = serializers.IntegerField(required=False)
    risk_flags = serializers.JSONField(required=False)
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
    buy_group_label = serializers.SerializerMethodField()
    buy_price_cny = serializers.DecimalField(source="direction_a_price_cny", max_digits=12, decimal_places=2)
    buy_source_price = serializers.DecimalField(source="direction_a_source_price", max_digits=12, decimal_places=2)
    buy_source_currency = serializers.CharField(source="direction_a_source_currency")
    buy_volume = serializers.IntegerField(source="direction_a_volume")
    buy_quotes = serializers.SerializerMethodField()

    sell_platform = serializers.CharField(source="direction_b_platform")
    sell_platform_label = serializers.CharField(source="direction_b_platform_label")
    sell_group = serializers.CharField(source="direction_b_group")
    sell_group_label = serializers.SerializerMethodField()
    sell_price_cny = serializers.DecimalField(source="direction_b_price_cny", max_digits=12, decimal_places=2)
    sell_source_price = serializers.DecimalField(source="direction_b_source_price", max_digits=12, decimal_places=2)
    sell_source_currency = serializers.CharField(source="direction_b_source_currency")
    sell_volume = serializers.IntegerField(source="direction_b_volume")
    sell_quotes = serializers.SerializerMethodField()
    sell_fee_rate = serializers.DecimalField(source="direction_b_fee_rate", max_digits=6, decimal_places=4)
    sell_net_cny = serializers.DecimalField(source="direction_b_net_cny", max_digits=12, decimal_places=2)
    favorite_id = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    liquidity_score = serializers.SerializerMethodField()
    risk_flags = serializers.SerializerMethodField()

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
            "buy_group_label",
            "buy_price_cny",
            "buy_source_price",
            "buy_source_currency",
            "buy_volume",
            "buy_quotes",
            "sell_platform",
            "sell_platform_label",
            "sell_group",
            "sell_group_label",
            "sell_price_cny",
            "sell_source_price",
            "sell_source_currency",
            "sell_volume",
            "sell_quotes",
            "sell_fee_rate",
            "sell_net_cny",
            "favorite_id",
            "is_favorited",
            "liquidity_score",
            "risk_flags",
            "profit_cny",
            "margin_pct",
            "usd_cny_rate",
            "min_volume",
            "calculation_batch_id",
            "calculated_at",
        )

    def get_buy_group_label(self, obj):
        return "国内市场" if obj.direction_a_group == "domestic" else "海外市场"

    def get_sell_group_label(self, obj):
        return "国内市场" if obj.direction_b_group == "domestic" else "海外市场"

    def get_buy_quotes(self, obj):
        return enrich_quote_payloads(obj.direction_a_quotes, obj.iteminfo)

    def get_sell_quotes(self, obj):
        return enrich_quote_payloads(
            obj.direction_b_quotes,
            obj.iteminfo,
            selected_sell_platform=obj.direction_b_platform,
            buy_price_cny=obj.direction_a_price_cny,
        )

    def get_favorite_id(self, obj):
        favorite_map = self.context.get("favorite_map") or {}
        favorite = favorite_map.get((obj.iteminfo_id, obj.direction_a_platform, obj.direction_b_platform))
        return favorite.id if favorite else None

    def get_is_favorited(self, obj):
        return self.get_favorite_id(obj) is not None

    def get_liquidity_score(self, obj):
        return opportunity_quality_payload(
            buy_volume=obj.direction_a_volume,
            sell_volume=obj.direction_b_volume,
            platform_count=len({quote.get("platform") for quote in (obj.direction_a_quotes or []) + (obj.direction_b_quotes or []) if isinstance(quote, dict)}),
            margin_pct=obj.margin_pct,
            calculated_at=obj.calculated_at,
        )["liquidity_score"]

    def get_risk_flags(self, obj):
        return opportunity_quality_payload(
            buy_volume=obj.direction_a_volume,
            sell_volume=obj.direction_b_volume,
            platform_count=len({quote.get("platform") for quote in (obj.direction_a_quotes or []) + (obj.direction_b_quotes or []) if isinstance(quote, dict)}),
            margin_pct=obj.margin_pct,
            calculated_at=obj.calculated_at,
        )["risk_flags"]


class PriceOpportunitySerializer(serializers.ModelSerializer):
    iteminfo = IteminfoSerializer()
    opportunities = serializers.SerializerMethodField()

    class Meta:
        model = Price
        fields = ("id", "iteminfo", "opportunities")

    def get_opportunities(self, obj):
        rows = opportunity_rows(obj)
        return ArbitrageOpportunitySerializer(rows, many=True).data


class OpportunityFavoriteSerializer(serializers.ModelSerializer):
    iteminfo = IteminfoSerializer(read_only=True)
    iteminfo_id = serializers.PrimaryKeyRelatedField(
        source="iteminfo",
        queryset=Iteminfo.objects.all(),
        write_only=True,
    )
    current_opportunity = serializers.SerializerMethodField()

    class Meta:
        model = OpportunityFavorite
        fields = (
            "id",
            "iteminfo",
            "iteminfo_id",
            "direction_a_platform",
            "direction_b_platform",
            "note",
            "current_opportunity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "iteminfo", "current_opportunity", "created_at", "updated_at")

    def create(self, validated_data):
        user = self.context["request"].user
        favorite, _created = OpportunityFavorite.objects.update_or_create(
            user=user,
            iteminfo=validated_data["iteminfo"],
            direction_a_platform=validated_data["direction_a_platform"],
            direction_b_platform=validated_data["direction_b_platform"],
            defaults={"note": validated_data.get("note", "")},
        )
        return favorite

    def get_current_opportunity(self, obj):
        opportunity = (
            ArbitrageOpportunity.objects.filter(
                iteminfo=obj.iteminfo,
                direction_a_platform=obj.direction_a_platform,
                direction_b_platform=obj.direction_b_platform,
            )
            .order_by("-calculated_at")
            .first()
        )
        if not opportunity:
            return None
        return {
            "profit_cny": str(opportunity.profit_cny),
            "margin_pct": str(opportunity.margin_pct),
            "buy_price_cny": str(opportunity.direction_a_price_cny),
            "sell_net_cny": str(opportunity.direction_b_net_cny),
            "calculated_at": opportunity.calculated_at,
        }


class TradeRecordSerializer(serializers.ModelSerializer):
    iteminfo = IteminfoSerializer(read_only=True)
    iteminfo_id = serializers.PrimaryKeyRelatedField(
        source="iteminfo",
        queryset=Iteminfo.objects.all(),
        write_only=True,
    )

    class Meta:
        model = TradeRecord
        fields = (
            "id",
            "iteminfo",
            "iteminfo_id",
            "direction_a_platform",
            "direction_b_platform",
            "buy_price_cny",
            "sell_price_cny",
            "sell_fee_cny",
            "other_cost_cny",
            "quantity",
            "realized_profit_cny",
            "traded_at",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "iteminfo", "realized_profit_cny", "created_at", "updated_at")

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("数量必须大于 0")
        return value

    def create(self, validated_data):
        return TradeRecord.objects.create(user=self.context["request"].user, **validated_data)


class PriceSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceSnapshot
        fields = (
            "id",
            "iteminfo",
            "platform",
            "platform_label",
            "price_cny",
            "source_price",
            "source_currency",
            "volume",
            "source_updated_at",
            "captured_at",
        )
        read_only_fields = fields
