from __future__ import annotations

import base64
import json
from decimal import Decimal, ROUND_HALF_UP
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings

from .models import Order


class PayPalError(RuntimeError):
    pass


def paypal_configured() -> bool:
    return bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_SECRET)


def format_paypal_amount(value: Decimal) -> str:
    return str(Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def paypal_request(path: str, *, method: str = "GET", token: str | None = None, data: dict | None = None) -> dict:
    url = f"{settings.PAYPAL_API_BASE_URL.rstrip('/')}{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=settings.PAYPAL_TIMEOUT_SECONDS) as response:
            payload = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise PayPalError(f"PayPal API error {exc.code}: {detail}") from exc
    except URLError as exc:
        raise PayPalError(f"PayPal API unavailable: {exc.reason}") from exc

    return json.loads(payload) if payload else {}


def get_access_token() -> str:
    if not paypal_configured():
        raise PayPalError("PayPal credentials are not configured.")

    credentials = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}".encode("utf-8")
    headers = {
        "Accept": "application/json",
        "Authorization": f"Basic {base64.b64encode(credentials).decode('ascii')}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    request = Request(
        f"{settings.PAYPAL_API_BASE_URL.rstrip('/')}/v1/oauth2/token",
        data=urlencode({"grant_type": "client_credentials"}).encode("ascii"),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.PAYPAL_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise PayPalError(f"PayPal auth error {exc.code}: {detail}") from exc
    except URLError as exc:
        raise PayPalError(f"PayPal auth unavailable: {exc.reason}") from exc

    token = payload.get("access_token")
    if not token:
        raise PayPalError("PayPal did not return an access token.")
    return token


def approval_url(payload: dict) -> str:
    for link in payload.get("links", []):
        if link.get("rel") == "approve":
            return link.get("href", "")
    return ""


def create_paypal_order(order: Order) -> dict:
    token = get_access_token()
    return_url = f"{settings.PAYPAL_RETURN_URL}?order={order.id}"
    cancel_url = f"{settings.PAYPAL_CANCEL_URL}?order={order.id}"
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": str(order.out_trade_no),
                "custom_id": str(order.id),
                "description": f"{settings.PAYPAL_BRAND_NAME} {order.plan.name}",
                "invoice_id": str(order.out_trade_no),
                "amount": {
                    "currency_code": settings.PAYPAL_CURRENCY,
                    "value": format_paypal_amount(order.amount_cny),
                },
            }
        ],
        "application_context": {
            "brand_name": settings.PAYPAL_BRAND_NAME,
            "landing_page": "LOGIN",
            "user_action": "PAY_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }
    result = paypal_request("/v2/checkout/orders", method="POST", token=token, data=payload)
    checkout_url = approval_url(result)
    if not checkout_url:
        raise PayPalError("PayPal did not return an approval URL.")
    return result


def capture_paypal_order(paypal_order_id: str) -> dict:
    token = get_access_token()
    return paypal_request(f"/v2/checkout/orders/{paypal_order_id}/capture", method="POST", token=token, data={})
