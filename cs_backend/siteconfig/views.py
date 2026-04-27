from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSetting
from .serializers import SiteSettingSerializer


class PublicConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSetting.objects.filter(is_public=True)
        return Response({setting.key: setting.value for setting in settings})


class SiteSettingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
