from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChecklistUpdateSerializer,
    EmailCodeRequestSerializer,
    LoginSerializer,
    RegisterSerializer,
    SteamBindSerializer,
    UserSerializer,
)
from .models import UserPlatformChecklist
from .services import ensure_profile, send_email_code, steam_login_url, verify_steam_openid
from .steam import SteamInventoryError, fetch_inventory


User = get_user_model()


CHECKLIST_ITEMS = [
    {"key": "steam_guard", "label": "Steam 手机令牌", "group": "steam"},
    {"key": "steam_inventory_public", "label": "Steam 库存公开", "group": "steam"},
    {"key": "steam_trade_url", "label": "Steam 交易链接", "group": "steam"},
    {"key": "buff_account", "label": "BUFF 账号", "group": "domestic"},
    {"key": "youpin_account", "label": "悠悠有品账号", "group": "domestic"},
    {"key": "waxpeer_account", "label": "Waxpeer 账号", "group": "foreign"},
    {"key": "shadowpay_account", "label": "ShadowPay 账号", "group": "foreign"},
    {"key": "payment_method", "label": "支付方式", "group": "finance"},
    {"key": "withdrawal_method", "label": "提现方式", "group": "finance"},
]


def token_response(user, http_status=status.HTTP_200_OK):
    token, _created = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=http_status,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return token_response(user, status.HTTP_201_CREATED)


class EmailCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = send_email_code(**serializer.validated_data)
        payload = {"detail": "验证码已发送", "expires_at": verification.expires_at}
        if settings.DEBUG:
            payload["debug_code"] = verification.code
        return Response(payload, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return token_response(serializer.validated_data["user"])


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class SteamLoginUrlView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"url": steam_login_url()})


class SteamCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            steam_id = verify_steam_openid(request.query_params)
        except Exception as exc:
            return Response({"detail": f"Steam 登录验证失败: {exc}"}, status=status.HTTP_400_BAD_REQUEST)
        if not steam_id:
            return Response({"detail": "Steam 登录验证失败"}, status=status.HTTP_400_BAD_REQUEST)
        username = f"steam_{steam_id}"
        user, _created = User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@steam.local"},
        )
        profile = ensure_profile(user)
        profile.steam_id = steam_id
        profile.save(update_fields=["steam_id", "updated_at"])
        return token_response(user)


class SteamBindView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SteamBindSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = ensure_profile(request.user)
        profile.steam_id = serializer.validated_data["steam_id"]
        profile.steam_persona_name = serializer.validated_data.get("steam_persona_name", "")
        profile.save(update_fields=["steam_id", "steam_persona_name", "updated_at"])
        return Response(UserSerializer(request.user).data)


class SteamMockLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.DEBUG:
            return Response({"detail": "仅开发环境可用"}, status=status.HTTP_403_FORBIDDEN)
        serializer = SteamBindSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        steam_id = serializer.validated_data["steam_id"]
        username = f"steam_{steam_id}"
        user, _created = User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@steam.local"},
        )
        profile = ensure_profile(user)
        profile.steam_id = steam_id
        profile.steam_persona_name = serializer.validated_data.get("steam_persona_name", "")
        profile.save(update_fields=["steam_id", "steam_persona_name", "updated_at"])
        return token_response(user)


class SteamInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = ensure_profile(request.user)
        steam_id = request.query_params.get("steam_id") or profile.steam_id
        if request.query_params.get("steam_id") and not request.user.is_staff:
            return Response({"detail": "仅管理员可查询任意 Steam ID"}, status=status.HTTP_403_FORBIDDEN)
        if not steam_id:
            return Response({"detail": "请先绑定 Steam ID"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = fetch_inventory(
                steam_id=steam_id,
                appid=request.query_params.get("appid", "730"),
                contextid=request.query_params.get("contextid", "2"),
            )
        except SteamInventoryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(payload)


class PlatformChecklistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = {
            item.key: item
            for item in UserPlatformChecklist.objects.filter(user=request.user)
        }
        items = []
        for item in CHECKLIST_ITEMS:
            record = records.get(item["key"])
            items.append(
                {
                    **item,
                    "is_completed": bool(record and record.is_completed),
                    "note": record.note if record else "",
                    "completed_at": record.completed_at if record else None,
                    "updated_at": record.updated_at if record else None,
                }
            )
        completed_count = sum(1 for item in items if item["is_completed"])
        return Response(
            {
                "items": items,
                "completed_count": completed_count,
                "total_count": len(items),
                "progress_pct": round(completed_count / len(items) * 100, 2) if items else 0,
            }
        )

    def patch(self, request):
        serializer = ChecklistUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        key = serializer.validated_data["key"]
        if key not in {item["key"] for item in CHECKLIST_ITEMS}:
            return Response({"detail": "未知清单项"}, status=status.HTTP_400_BAD_REQUEST)
        record, _created = UserPlatformChecklist.objects.get_or_create(user=request.user, key=key)
        record.is_completed = serializer.validated_data["is_completed"]
        record.note = serializer.validated_data.get("note", record.note)
        record.save()
        return self.get(request)
