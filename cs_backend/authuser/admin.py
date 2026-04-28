from django.contrib import admin

from .models import EmailVerificationCode, UserPlatformChecklist, UserProfile, UserSteamInventoryItem


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "steam_id", "steam_persona_name", "updated_at")
    search_fields = ("user__username", "user__email", "steam_id")


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "purpose", "is_used", "expires_at", "created_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("email",)


@admin.register(UserPlatformChecklist)
class UserPlatformChecklistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "key", "is_completed", "completed_at", "updated_at")
    list_filter = ("key", "is_completed")
    search_fields = ("user__username", "user__email", "key")


@admin.register(UserSteamInventoryItem)
class UserSteamInventoryItemAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "steam_id", "market_hash_name", "assetid", "is_active", "synced_at")
    list_filter = ("is_active", "tradable", "marketable", "appid", "contextid")
    search_fields = ("user__username", "steam_id", "assetid", "market_hash_name", "market_name", "name")
