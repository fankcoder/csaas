from django.urls import path

from .views import (
    EmailCodeView,
    LoginView,
    MeView,
    PlatformChecklistView,
    RegisterView,
    SteamBindView,
    SteamInventoryView,
    SteamInventorySyncView,
    SteamCallbackView,
    SteamLoginUrlView,
    SteamMockLoginView,
)


urlpatterns = [
    path("email-code/", EmailCodeView.as_view(), name="email-code"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("checklist/", PlatformChecklistView.as_view(), name="platform-checklist"),
    path("steam/login-url/", SteamLoginUrlView.as_view(), name="steam-login-url"),
    path("steam/callback/", SteamCallbackView.as_view(), name="steam-callback"),
    path("steam/mock-login/", SteamMockLoginView.as_view(), name="steam-mock-login"),
    path("steam/bind/", SteamBindView.as_view(), name="steam-bind"),
    path("steam/inventory/", SteamInventoryView.as_view(), name="steam-inventory"),
    path("steam/inventory/sync/", SteamInventorySyncView.as_view(), name="steam-inventory-sync"),
]
