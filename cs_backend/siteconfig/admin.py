from django.contrib import admin

from .models import SiteSetting


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "is_public", "updated_at")
    search_fields = ("key", "description")
    list_filter = ("is_public",)
