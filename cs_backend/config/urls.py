from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request):
    return Response({"status": "ok", "service": "cs2-arbitrage-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("authuser.urls")),
    path("api/price/", include("price.urls")),
    path("api/siteconfig/", include("siteconfig.urls")),
    path("api/pay/", include("pay.urls")),
]
