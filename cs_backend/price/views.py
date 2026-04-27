from decimal import Decimal

from django.db.models import F, Q
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ArbitrageOpportunity, Price
from .serializers import (
    PriceOpportunitySerializer,
    PriceSerializer,
    StoredArbitrageOpportunitySerializer,
)
from .services import decimal_or_none


class PriceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]

    def get(self, request):
        params = request.query_params
        q = params.get("q")
        category = params.get("category")
        quality = params.get("quality")
        buy_platform = params.get("buy_platform") or None
        sell_platform = params.get("sell_platform") or None
        min_volume = int(params.get("min_volume") or 1)
        limit = min(int(params.get("limit") or 100), 500)

        min_profit = decimal_or_none(params.get("min_profit")) or Decimal("0")
        min_margin = decimal_or_none(params.get("min_margin"))
        cross_group_only = params.get("cross_group_only", "true").lower() != "false"

        queryset = ArbitrageOpportunity.objects.select_related("iteminfo")
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

        rows = list(queryset.order_by("-profit_cny")[:limit])
        serializer = StoredArbitrageOpportunitySerializer(rows, many=True)
        return Response(
            {
                "count": len(rows),
                "source": "arbitrage_opportunity",
                "min_volume": min_volume,
                "results": serializer.data,
            }
        )


class PriceOpportunityViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = PriceOpportunitySerializer
    queryset = Price.objects.select_related("iteminfo").filter(iteminfo__isnull=False)


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
