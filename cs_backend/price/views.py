from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Count, F, Max, OuterRef, Q, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from pay.permissions import HasActiveSubscription

from .models import ArbitrageOpportunity, Iteminfo, ItemPlatformListing, OpportunityFavorite, Price, PriceSnapshot, TradeRecord
from .serializers import (
    IteminfoSerializer,
    OpportunityFavoriteSerializer,
    PriceOpportunitySerializer,
    PriceSerializer,
    StoredArbitrageOpportunitySerializer,
    TradeRecordSerializer,
)
from .services import build_quotes, decimal_or_none, iso_datetime, platform_listing_map, platform_market_url


def favorite_map_for(user, opportunities):
    if not user or not user.is_authenticated or not opportunities:
        return {}
    keys = {
        (item.iteminfo_id, item.direction_a_platform, item.direction_b_platform)
        for item in opportunities
    }
    item_ids = {key[0] for key in keys}
    favorites = OpportunityFavorite.objects.filter(user=user, iteminfo_id__in=item_ids)
    return {
        (favorite.iteminfo_id, favorite.direction_a_platform, favorite.direction_b_platform): favorite
        for favorite in favorites
        if (favorite.iteminfo_id, favorite.direction_a_platform, favorite.direction_b_platform) in keys
    }


class PriceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PriceSerializer

    def get_queryset(self):
        queryset = Price.objects.select_related("iteminfo").filter(iteminfo__isnull=False)
        q = self.request.query_params.get("q")
        category = self.request.query_params.get("category")
        quality = self.request.query_params.get("quality")

        if q:
            queryset = queryset.filter(
                Q(iteminfo__market_hash_name__icontains=q)
                | Q(iteminfo__market_name_cn__icontains=q)
                | Q(iteminfo__name__icontains=q)
            )
        if category:
            queryset = queryset.filter(iteminfo__category=category)
        if quality:
            queryset = queryset.filter(iteminfo__quality=quality)
        return queryset.order_by("iteminfo__market_hash_name")


class ArbitrageView(APIView):
    permission_classes = [HasActiveSubscription]

    def get(self, request):
        params = request.query_params
        q = params.get("q")
        category = params.get("category")
        quality = params.get("quality")
        buy_platform = params.get("buy_platform") or None
        sell_platform = params.get("sell_platform") or None
        min_volume = int(params.get("min_volume") or 1)

        min_profit = decimal_or_none(params.get("min_profit")) or Decimal("0")
        min_margin = decimal_or_none(params.get("min_margin"))
        cross_group_only = params.get("cross_group_only", "true").lower() != "false"

        queryset = ArbitrageOpportunity.objects.select_related("iteminfo", "iteminfo__price").prefetch_related(
            "iteminfo__platform_listings"
        )
        if q:
            queryset = queryset.filter(
                Q(iteminfo__market_hash_name__icontains=q)
                | Q(iteminfo__market_name_cn__icontains=q)
                | Q(iteminfo__name__icontains=q)
            )
        if category:
            queryset = queryset.filter(iteminfo__category=category)
        if quality:
            queryset = queryset.filter(iteminfo__quality=quality)
        if buy_platform:
            queryset = queryset.filter(direction_a_platform=buy_platform)
        if sell_platform:
            queryset = queryset.filter(direction_b_platform=sell_platform)
        if cross_group_only:
            queryset = queryset.exclude(direction_a_group=F("direction_b_group"))
        queryset = queryset.filter(
            direction_a_volume__gte=min_volume,
            direction_b_volume__gte=min_volume,
            profit_cny__gt=min_profit,
        )
        if min_margin is not None:
            queryset = queryset.filter(margin_pct__gte=min_margin)

        best_row_id = (
            queryset.filter(iteminfo_id=OuterRef("iteminfo_id"))
            .order_by("-profit_cny", "id")
            .values("id")[:1]
        )
        queryset = queryset.filter(id=Subquery(best_row_id))

        paginator = PageNumberPagination()
        paginator.page_size = 30
        paginator.page_size_query_param = "page_size"
        paginator.max_page_size = 100
        page = paginator.paginate_queryset(queryset.order_by("-profit_cny"), request, view=self)
        serializer = StoredArbitrageOpportunitySerializer(
            page,
            many=True,
            context={"request": request, "favorite_map": favorite_map_for(request.user, page)},
        )
        response = paginator.get_paginated_response(serializer.data)
        response.data["source"] = "arbitrage_opportunity"
        response.data["min_volume"] = min_volume
        return response


class ArbitrageSampleView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        limit = min(int(request.query_params.get("limit") or 5), 10)
        rows = list(
            ArbitrageOpportunity.objects.select_related("iteminfo")
            .select_related("iteminfo__price")
            .prefetch_related("iteminfo__platform_listings")
            .order_by("-profit_cny")[:limit]
        )
        serializer = StoredArbitrageOpportunitySerializer(rows, many=True)
        return Response(
            {
                "count": len(rows),
                "sample": True,
                "upgrade_required_for_full_data": True,
                "results": serializer.data,
            }
        )


class PriceOpportunityViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasActiveSubscription]
    serializer_class = PriceOpportunitySerializer
    queryset = Price.objects.select_related("iteminfo").filter(iteminfo__isnull=False)


class ItemPriceHistoryView(APIView):
    permission_classes = [HasActiveSubscription]

    def get(self, request, iteminfo_id: int):
        days = min(max(int(request.query_params.get("days") or 7), 1), 90)
        since = timezone.now() - timedelta(days=days)
        item = get_object_or_404(
            Iteminfo.objects.prefetch_related("platform_listings"),
            pk=iteminfo_id,
        )
        price = Price.objects.filter(iteminfo=item).first()
        snapshots = (
            PriceSnapshot.objects.filter(iteminfo=item, captured_at__gte=since)
            .order_by("captured_at", "platform")
        )

        grouped: dict[str, dict] = {}
        for snapshot in snapshots:
            bucket = grouped.setdefault(
                snapshot.platform,
                {
                    "platform": snapshot.platform,
                    "label": snapshot.platform_label,
                    "color": platform_color(snapshot.platform),
                    "points": [],
                },
            )
            bucket["points"].append(
                {
                    "captured_at": snapshot.captured_at,
                    "price_cny": str(snapshot.price_cny),
                    "source_price": str(snapshot.source_price),
                    "source_currency": snapshot.source_currency,
                    "volume": snapshot.volume,
                    "source_updated_at": snapshot.source_updated_at,
                }
            )

        current_quotes = []
        platform_ids = platform_listing_map(item)
        if price:
            for quote in build_quotes(price):
                current_quotes.append(
                    {
                        "platform": quote.platform,
                        "label": quote.label,
                        "price_cny": str(quote.price_cny),
                        "source_price": str(quote.source_price),
                        "source_currency": quote.source_currency,
                        "volume": quote.volume,
                        "last_updated_at": iso_datetime(quote.last_updated_at),
                        "market_url": platform_market_url(quote.platform, item.market_hash_name, platform_ids),
                        "color": platform_color(quote.platform),
                    }
                )

        return Response(
            {
                "item": IteminfoSerializer(item).data,
                "days": days,
                "sync_interval_minutes": 30,
                "current_quotes": current_quotes,
                "series": list(grouped.values()),
            }
        )


class MarketSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Price.objects.filter(iteminfo__isnull=False)
        return Response(
            {
                "items": queryset.count(),
                "with_buff": queryset.exclude(buff_sell_price__isnull=True).count(),
                "with_waxpeer": queryset.exclude(wax_price__isnull=True).count(),
                "with_shadowpay": queryset.exclude(shadow_price__isnull=True).count(),
            }
        )


def platform_color(platform: str) -> str:
    return {
        "buff": "#1E40AF",
        "youpin": "#F59E0B",
        "waxpeer": "#0891B2",
        "shadowpay": "#7C3AED",
        "c5": "#059669",
    }.get(platform.lower(), "#475569")


class MarketStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Price.objects.filter(iteminfo__isnull=False)
        platforms = [
            {
                "platform": "buff",
                "label": "BUFF",
                "items": queryset.exclude(buff_sell_price__isnull=True).count(),
                "last_updated_at": queryset.aggregate(value=Max("buff_time"))["value"],
            },
            {
                "platform": "youpin",
                "label": "YouPin",
                "items": queryset.exclude(uu_price__isnull=True).count(),
                "last_updated_at": queryset.aggregate(value=Max("uu_time"))["value"],
            },
            {
                "platform": "waxpeer",
                "label": "Waxpeer",
                "items": queryset.exclude(wax_price__isnull=True).count(),
                "last_updated_at": queryset.aggregate(value=Max("wax_time"))["value"],
            },
            {
                "platform": "shadowpay",
                "label": "ShadowPay",
                "items": queryset.exclude(shadow_price__isnull=True).count(),
                "last_updated_at": queryset.aggregate(value=Max("shadow_time"))["value"],
            },
        ]
        return Response(
            {
                "usd_cny_rate": str(settings.USD_CNY_RATE),
                "total_items": queryset.count(),
                "total_opportunities": ArbitrageOpportunity.objects.count(),
                "platforms": platforms,
                "listings": list(
                    ItemPlatformListing.objects.values("platform")
                    .annotate(count=Count("id"))
                    .order_by("platform")
                ),
            }
        )


class OpportunityFavoriteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OpportunityFavoriteSerializer

    def get_queryset(self):
        return (
            OpportunityFavorite.objects.select_related("iteminfo")
            .filter(user=self.request.user)
            .order_by("-updated_at")
        )


class TradeRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TradeRecordSerializer

    def get_queryset(self):
        return (
            TradeRecord.objects.select_related("iteminfo")
            .filter(user=self.request.user)
            .order_by("-traded_at", "-id")
        )
