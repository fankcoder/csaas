from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from pay.services import serialize_subscription, user_has_premium

from .services import consume_email_code, ensure_profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    steam_id = serializers.SerializerMethodField()
    steam_persona_name = serializers.SerializerMethodField()
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
            "has_premium",
            "subscription",
        )
        read_only_fields = fields

    def get_steam_id(self, obj):
        return ensure_profile(obj).steam_id

    def get_steam_persona_name(self, obj):
        return ensure_profile(obj).steam_persona_name

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
