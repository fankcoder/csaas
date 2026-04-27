from django.contrib import admin

from .models import Order, Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "price_cny", "duration_days", "is_active", "sort")
    list_filter = ("is_active",)
    search_fields = ("code", "name")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("out_trade_no", "user", "plan", "amount_cny", "status", "created_at")
    list_filter = ("status", "provider")
    search_fields = ("out_trade_no", "user__username")
