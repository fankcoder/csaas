from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ArbitrageView, MarketSummaryView, PriceOpportunityViewSet, PriceViewSet


router = DefaultRouter()
router.register("items", PriceViewSet, basename="price-items")
router.register("opportunities", PriceOpportunityViewSet, basename="price-opportunities")

urlpatterns = [
    path("", include(router.urls)),
    path("arbitrage/", ArbitrageView.as_view(), name="arbitrage"),
    path("summary/", MarketSummaryView.as_view(), name="market-summary"),
]
