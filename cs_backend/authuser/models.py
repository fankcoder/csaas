from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    steam_id = models.CharField(max_length=32, blank=True, db_index=True)
    steam_openid_claimed_id = models.CharField(max_length=255, blank=True)
    steam_openid_identity = models.CharField(max_length=255, blank=True)
    steam_persona_name = models.CharField(max_length=128, blank=True)
    steam_profile_url = models.CharField(max_length=255, blank=True)
    steam_avatar = models.CharField(max_length=255, blank=True)
    steam_avatar_medium = models.CharField(max_length=255, blank=True)
    steam_avatar_full = models.CharField(max_length=255, blank=True)
    steam_community_visibility_state = models.IntegerField(blank=True, null=True)
    steam_profile_state = models.IntegerField(blank=True, null=True)
    steam_persona_state = models.IntegerField(blank=True, null=True)
    steam_last_logoff = models.DateTimeField(blank=True, null=True)
    steam_comment_permission = models.IntegerField(blank=True, null=True)
    steam_real_name = models.CharField(max_length=128, blank=True)
    steam_primary_clan_id = models.CharField(max_length=32, blank=True)
    steam_time_created = models.DateTimeField(blank=True, null=True)
    steam_persona_state_flags = models.IntegerField(blank=True, null=True)
    steam_loc_country_code = models.CharField(max_length=8, blank=True)
    steam_loc_state_code = models.CharField(max_length=32, blank=True)
    steam_loc_city_id = models.IntegerField(blank=True, null=True)
    steam_profile_raw = models.JSONField(default=dict, blank=True)
    steam_openid_raw = models.JSONField(default=dict, blank=True)
    steam_profile_synced_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.user.username


class EmailVerificationCode(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=8)
    purpose = models.CharField(max_length=30, default="register")
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email", "purpose", "is_used"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_valid(self) -> bool:
        return not self.is_used and self.expires_at > timezone.now()


class UserPlatformChecklist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="platform_checklist")
    key = models.CharField(max_length=50)
    is_completed = models.BooleanField(default=False)
    note = models.CharField(max_length=255, blank=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "key"), name="uniq_user_platform_checklist_key")
        ]
        indexes = [
            models.Index(fields=["user", "is_completed"]),
            models.Index(fields=["key"]),
        ]

    def save(self, *args, **kwargs):
        if self.is_completed and self.completed_at is None:
            self.completed_at = timezone.now()
        if not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.key}"


class UserSteamInventoryItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="steam_inventory_items")
    steam_id = models.CharField(max_length=32, db_index=True)
    appid = models.CharField(max_length=16, default="730")
    contextid = models.CharField(max_length=16, default="2")
    assetid = models.CharField(max_length=64)
    classid = models.CharField(max_length=64, blank=True)
    instanceid = models.CharField(max_length=64, blank=True)
    amount = models.PositiveIntegerField(default=1)
    market_hash_name = models.CharField(max_length=255, blank=True, db_index=True)
    market_name = models.CharField(max_length=255, blank=True)
    name = models.CharField(max_length=255, blank=True)
    name_color = models.CharField(max_length=32, blank=True)
    type = models.CharField(max_length=128, blank=True)
    icon_url = models.CharField(max_length=512, blank=True)
    tradable = models.BooleanField(default=False)
    marketable = models.BooleanField(default=False)
    commodity = models.BooleanField(default=False)
    inspect_url = models.CharField(max_length=512, blank=True)
    exterior = models.CharField(max_length=64, blank=True)
    raw_asset = models.JSONField(default=dict, blank=True)
    raw_description = models.JSONField(default=dict, blank=True)
    raw_properties = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    synced_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_steam_inventory_item"
        constraints = [
            models.UniqueConstraint(
                fields=("user", "appid", "contextid", "assetid"),
                name="uniq_user_steam_inventory_asset",
            )
        ]
        indexes = [
            models.Index(fields=["user", "is_active", "-synced_at"]),
            models.Index(fields=["steam_id", "appid", "contextid"]),
            models.Index(fields=["market_hash_name"]),
        ]

    def __str__(self) -> str:
        return self.market_hash_name or self.assetid
