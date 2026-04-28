from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from pay.services import serialize_subscription, user_has_premium

from price.services import build_quotes, platform_market_url, quote_net_cny

from .models import UserSteamInventoryItem
from .services import consume_email_code, ensure_profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    steam_id = serializers.SerializerMethodField()
    steam_persona_name = serializers.SerializerMethodField()
    steam_profile = serializers.SerializerMethodField()
    has_premium = serializers.SerializerMethodField()
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "date_joined",
            "steam_id",
            "steam_persona_name",
            "steam_profile",
            "has_premium",
            "subscription",
        )
        read_only_fields = fields

    def get_steam_id(self, obj):
        return ensure_profile(obj).steam_id

    def get_steam_persona_name(self, obj):
        return ensure_profile(obj).steam_persona_name

    def get_steam_profile(self, obj):
        profile = ensure_profile(obj)
        return {
            "steam_id": profile.steam_id,
            "openid_claimed_id": profile.steam_openid_claimed_id,
            "openid_identity": profile.steam_openid_identity,
            "persona_name": profile.steam_persona_name,
            "profile_url": profile.steam_profile_url,
            "avatar": profile.steam_avatar,
            "avatar_medium": profile.steam_avatar_medium,
            "avatar_full": profile.steam_avatar_full,
            "community_visibility_state": profile.steam_community_visibility_state,
            "profile_state": profile.steam_profile_state,
            "persona_state": profile.steam_persona_state,
            "last_logoff": profile.steam_last_logoff,
            "comment_permission": profile.steam_comment_permission,
            "real_name": profile.steam_real_name,
            "primary_clan_id": profile.steam_primary_clan_id,
            "time_created": profile.steam_time_created,
            "persona_state_flags": profile.steam_persona_state_flags,
            "loc_country_code": profile.steam_loc_country_code,
            "loc_state_code": profile.steam_loc_state_code,
            "loc_city_id": profile.steam_loc_city_id,
            "profile_raw": profile.steam_profile_raw,
            "profile_synced_at": profile.steam_profile_synced_at,
        }

    def get_has_premium(self, obj):
        return user_has_premium(obj)

    def get_subscription(self, obj):
        return serialize_subscription(obj)


class EmailCodeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=("register",), default="register")


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    code = serializers.CharField(write_only=True, max_length=8)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("邮箱已注册")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"])
        if not consume_email_code(attrs["email"], attrs["code"], purpose="register"):
            raise serializers.ValidationError("邮箱验证码无效或已过期")
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        ensure_profile(user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("用户名或密码错误")
        if not user.is_active:
            raise serializers.ValidationError("账号已被禁用")
        attrs["user"] = user
        return attrs


class SteamBindSerializer(serializers.Serializer):
    steam_id = serializers.RegexField(regex=r"^\d{17}$")
    steam_persona_name = serializers.CharField(required=False, allow_blank=True, max_length=128)


class ChecklistUpdateSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=50)
    is_completed = serializers.BooleanField()
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class UserSteamInventoryItemSerializer(serializers.ModelSerializer):
    sell_prices = serializers.SerializerMethodField()
    best_sell_price = serializers.SerializerMethodField()
    steam_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserSteamInventoryItem
        fields = (
            "id",
            "steam_id",
            "appid",
            "contextid",
            "assetid",
            "classid",
            "instanceid",
            "amount",
            "market_hash_name",
            "market_name",
            "name",
            "name_color",
            "type",
            "icon_url",
            "steam_image_url",
            "tradable",
            "marketable",
            "commodity",
            "inspect_url",
            "exterior",
            "sell_prices",
            "best_sell_price",
            "is_active",
            "synced_at",
        )
        read_only_fields = fields

    def get_price(self, obj):
        price_map = self.context.get("price_map") or {}
        return price_map.get(obj.market_hash_name)

    def get_sell_prices(self, obj):
        price = self.get_price(obj)
        if not price:
            return []
        quotes = []
        for quote in build_quotes(price):
            quotes.append(
                {
                    "platform": quote.platform,
                    "label": quote.label,
                    "price_cny": str(quote.price_cny),
                    "net_price_cny": str(quote_net_cny(quote)),
                    "source_price": str(quote.source_price),
                    "source_currency": quote.source_currency,
                    "volume": quote.volume,
                    "sell_fee": str(quote.sell_fee),
                    "last_updated_at": quote.last_updated_at,
                    "market_url": platform_market_url(quote.platform, obj.market_hash_name),
                }
            )
        return quotes

    def get_best_sell_price(self, obj):
        prices = self.get_sell_prices(obj)
        if not prices:
            return None
        return max(prices, key=lambda item: float(item["net_price_cny"]))

    def get_steam_image_url(self, obj):
        if not obj.icon_url:
            return ""
        return f"https://community.cloudflare.steamstatic.com/economy/image/{obj.icon_url}"
