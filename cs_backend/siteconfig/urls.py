from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PublicConfigView, SiteSettingViewSet


router = DefaultRouter()
router.register("settings", SiteSettingViewSet, basename="site-settings")

urlpatterns = [
    path("public/", PublicConfigView.as_view(), name="public-config"),
    path("", include(router.urls)),
]
