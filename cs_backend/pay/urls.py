from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CurrentSubscriptionViewSet, OrderViewSet, PlanViewSet


router = DefaultRouter()
router.register("plans", PlanViewSet, basename="plans")
router.register("orders", OrderViewSet, basename="orders")
router.register("subscription", CurrentSubscriptionViewSet, basename="subscription")

urlpatterns = [path("", include(router.urls))]
