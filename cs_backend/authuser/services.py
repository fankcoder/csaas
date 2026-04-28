from __future__ import annotations

import secrets
import urllib.parse
import urllib.request
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerificationCode, UserProfile


STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login"


def ensure_profile(user):
    profile, _created = UserProfile.objects.get_or_create(user=user)
    return profile


def create_email_code(email: str, purpose: str = "register") -> EmailVerificationCode:
    EmailVerificationCode.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)
    code = f"{secrets.randbelow(1_000_000):06d}"
    return EmailVerificationCode.objects.create(
        email=email,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timezone.timedelta(seconds=settings.EMAIL_VERIFICATION_TTL_SECONDS),
    )


def send_email_code(email: str, purpose: str = "register") -> EmailVerificationCode:
    verification = create_email_code(email=email, purpose=purpose)
    send_mail(
        subject="CS2 Arbitrage verification code",
        message=f"Your verification code is {verification.code}. It expires in 10 minutes.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    return verification


def consume_email_code(email: str, code: str, purpose: str = "register") -> bool:
    verification = (
        EmailVerificationCode.objects.filter(
            email=email,
            code=code,
            purpose=purpose,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )
    if not verification or not verification.is_valid():
        return False
    verification.is_used = True
    verification.save(update_fields=["is_used"])
    return True


def steam_login_payload() -> dict[str, str]:
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": settings.STEAM_OPENID_RETURN_TO,
        "openid.realm": settings.STEAM_OPENID_REALM,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return {
        "provider": "steam_openid",
        "url": f"{STEAM_OPENID_ENDPOINT}?{urlencode(params)}",
        "return_to": settings.STEAM_OPENID_RETURN_TO,
        "realm": settings.STEAM_OPENID_REALM,
    }


def extract_steam_id(claimed_id: str) -> str:
    return claimed_id.rstrip("/").split("/")[-1]


def verify_steam_openid(query_params) -> str | None:
    payload = dict(query_params.items())
    payload["openid.mode"] = "check_authentication"
    encoded = urllib.parse.urlencode(payload).encode("utf-8")
    request = urllib.request.Request(
        STEAM_OPENID_ENDPOINT,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode("utf-8")
    if "is_valid:true" not in body:
        return None
    claimed_id = query_params.get("openid.claimed_id", "")
    identity = query_params.get("openid.identity", "")
    op_endpoint = query_params.get("openid.op_endpoint", "")
    if (
        not claimed_id.startswith("https://steamcommunity.com/openid/id/")
        or not identity.startswith("https://steamcommunity.com/openid/id/")
        or op_endpoint != STEAM_OPENID_ENDPOINT
    ):
        return None
    return extract_steam_id(claimed_id)
