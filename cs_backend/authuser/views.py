from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChecklistUpdateSerializer,
    EmailCodeRequestSerializer,
    LoginSerializer,
    RegisterSerializer,
    SteamBindSerializer,
    UserSteamInventoryItemSerializer,
    UserSerializer,
)
from price.models import Price

from .models import UserPlatformChecklist, UserProfile, UserSteamInventoryItem
from .services import (
    ensure_profile,
    send_email_code,
    steam_login_payload,
    verify_steam_openid,
)
from .steam import (
    SteamInventoryError,
    SteamProfileError,
    fetch_inventory,
    fetch_player_summary,
    normalize_inventory_payload,
    update_profile_from_steam,
)


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

STEAM_INVENTORY_SYNC_TTL_SECONDS = 300


class SteamInventoryPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50


def frontend_steam_callback_url(**params):
    from urllib.parse import urlencode

    base_url = settings.FRONTEND_BASE_URL.rstrip("/")
    query = urlencode({key: value for key, value in params.items() if value})
    return f"{base_url}/steam/callback{f'?{query}' if query else ''}"


def token_response(user, http_status=status.HTTP_200_OK):
    token, _created = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=http_status,
    )


def inventory_sync_cache_key(user_id: int) -> str:
    return f"steam_inventory_sync:{user_id}"


def price_map_for_inventory(items):
    names = {item.market_hash_name for item in items if item.market_hash_name}
    if not names:
        return {}
    prices = Price.objects.select_related("iteminfo").filter(iteminfo__market_hash_name__in=names)
    return {price.iteminfo.market_hash_name: price for price in prices if price.iteminfo}


def inventory_response(request, *, synced=False, sync_meta=None):
    queryset = (
        UserSteamInventoryItem.objects.filter(user=request.user, is_active=True)
        .order_by("-synced_at", "market_hash_name", "assetid")
    )

    paginator = SteamInventoryPagination()
    page = paginator.paginate_queryset(queryset, request)
    page_items = list(page)
    serializer = UserSteamInventoryItemSerializer(
        page_items,
        many=True,
        context={"request": request, "price_map": price_map_for_inventory(page_items)},
    )
    latest_sync = queryset.values_list("synced_at", flat=True).first()
    response = paginator.get_paginated_response(serializer.data)
    response.data["synced"] = synced
    response.data["latest_sync_at"] = latest_sync
    response.data["sync_meta"] = sync_meta or {}
    response.data["page_size"] = paginator.get_page_size(request)
    return response


def sync_inventory_to_database(user, *, steam_id: str, appid="730", contextid="2"):
    payload = fetch_inventory(steam_id=steam_id, appid=appid, contextid=contextid)
    normalized_items = normalize_inventory_payload(payload)
    synced_at = timezone.now()
    active_asset_ids = {item["assetid"] for item in normalized_items if item["assetid"]}
    updated_count = 0

    with transaction.atomic():
        if active_asset_ids:
            UserSteamInventoryItem.objects.filter(
                user=user,
                appid=str(appid),
                contextid=str(contextid),
                is_active=True,
            ).exclude(assetid__in=active_asset_ids).update(is_active=False, synced_at=synced_at)

        for item in normalized_items:
            if not item["assetid"]:
                continue
            UserSteamInventoryItem.objects.update_or_create(
                user=user,
                appid=item["appid"],
                contextid=item["contextid"],
                assetid=item["assetid"],
                defaults={
                    "steam_id": steam_id,
                    "classid": item["classid"],
                    "instanceid": item["instanceid"],
                    "amount": item["amount"],
                    "market_hash_name": item["market_hash_name"],
                    "market_name": item["market_name"],
                    "name": item["name"],
                    "name_color": item["name_color"],
                    "type": item["type"],
                    "icon_url": item["icon_url"],
                    "tradable": item["tradable"],
                    "marketable": item["marketable"],
                    "commodity": item["commodity"],
                    "inspect_url": item["inspect_url"],
                    "exterior": item["exterior"],
                    "raw_asset": item["asset"],
                    "raw_description": item["description"],
                    "raw_properties": item["properties"],
                    "is_active": True,
                    "synced_at": synced_at,
                },
            )
            updated_count += 1

    return {
        "steam_id": steam_id,
        "appid": str(appid),
        "contextid": str(contextid),
        "total_inventory_count": payload.get("total_inventory_count"),
        "synced_count": updated_count,
        "synced_at": synced_at,
    }


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
        return Response(steam_login_payload())


class SteamCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            steam_id = verify_steam_openid(request.query_params)
        except Exception as exc:
            return redirect(frontend_steam_callback_url(error=f"Steam 登录验证失败: {exc}"))
        if not steam_id:
            return redirect(frontend_steam_callback_url(error="Steam 登录验证失败"))

        username = f"steam_{steam_id}"
        existing_profile = UserProfile.objects.select_related("user").filter(steam_id=steam_id).first()
        if existing_profile:
            user = existing_profile.user
            profile = existing_profile
        else:
            user, _created = User.objects.get_or_create(
                username=username,
                defaults={"email": f"{username}@steam.local"},
            )
            profile = ensure_profile(user)

        try:
            player = fetch_player_summary(settings.STEAM_API_KEY, steam_id)
        except SteamProfileError:
            player = {}

        update_profile_from_steam(
            ensure_profile(user),
            steam_id=steam_id,
            openid_payload=dict(request.query_params.items()),
            player=player,
        )

        token, _created = Token.objects.get_or_create(user=user)
        return redirect(frontend_steam_callback_url(token=token.key))


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
        return inventory_response(request)


class SteamInventorySyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = ensure_profile(request.user)
        steam_id = request.data.get("steam_id") or request.query_params.get("steam_id") or profile.steam_id
        if (request.data.get("steam_id") or request.query_params.get("steam_id")) and not request.user.is_staff:
            return Response({"detail": "仅管理员可查询任意 Steam ID"}, status=status.HTTP_403_FORBIDDEN)
        if not steam_id:
            return Response({"detail": "请先绑定 Steam ID"}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = inventory_sync_cache_key(request.user.id)
        if not cache.add(cache_key, timezone.now().isoformat(), timeout=STEAM_INVENTORY_SYNC_TTL_SECONDS):
            return Response(
                {
                    "detail": "库存同步排队中，请稍后再试",
                    "retry_after_seconds": STEAM_INVENTORY_SYNC_TTL_SECONDS,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            sync_meta = sync_inventory_to_database(
                request.user,
                steam_id=steam_id,
                appid=request.data.get("appid") or request.query_params.get("appid", "730"),
                contextid=request.data.get("contextid") or request.query_params.get("contextid", "2"),
            )
        except SteamInventoryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return inventory_response(request, synced=True, sync_meta=sync_meta)


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
