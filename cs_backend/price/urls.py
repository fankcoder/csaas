from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ArbitrageSampleView,
    ArbitrageView,
    ItemPriceHistoryView,
    MarketStatusView,
    MarketSummaryView,
    OpportunityFavoriteViewSet,
    PriceOpportunityViewSet,
    PriceViewSet,
    TradeRecordViewSet,
)


router = DefaultRouter()
router.register("items", PriceViewSet, basename="price-items")
router.register("opportunities", PriceOpportunityViewSet, basename="price-opportunities")
router.register("favorites", OpportunityFavoriteViewSet, basename="price-favorites")
router.register("trade-records", TradeRecordViewSet, basename="price-trade-records")

urlpatterns = [
    path("", include(router.urls)),
    path("arbitrage/", ArbitrageView.as_view(), name="arbitrage"),
    path("arbitrage-sample/", ArbitrageSampleView.as_view(), name="arbitrage-sample"),
    path("iteminfo/<int:iteminfo_id>/history/", ItemPriceHistoryView.as_view(), name="item-price-history"),
    path("summary/", MarketSummaryView.as_view(), name="market-summary"),
    path("status/", MarketStatusView.as_view(), name="market-status"),
]
