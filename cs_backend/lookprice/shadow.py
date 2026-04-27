from __future__ import annotations

from typing import Any

import requests

from platform_auth import get_shadow_header
from repository import record_site_update, upsert_shadowpay_item


URL = "https://api.shadowpay.com/api/v2/user/items/prices?project=csgo"


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    status = payload.get("status", payload.get("success"))
    if status not in ("success", True, "true", 1, "1"):
        print(f"ShadowPay unexpected response: {payload.get('message') or payload.get('error') or payload}")
        return []

    data = payload.get("data") or payload.get("items") or []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "list", "data"):
            value = data.get(key)
            if isinstance(value, list):
                return value
    return []


def crawl() -> int:
    headers = get_shadow_header()
    if headers is None:
        return 0

    try:
        response = requests.get(URL, headers=headers, timeout=60)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        print(f"ShadowPay request failed: {exc}")
        return 0

    saved = 0
    for raw in extract_items(payload):
        if upsert_shadowpay_item(raw):
            saved += 1
            print(raw.get("steam_market_hash_name") or raw.get("name"), raw.get("price"))
    record_site_update("sha_update", "shadowpay", {"items": saved})
    print(f"shadowpay items={saved}")
    return saved


if __name__ == "__main__":
    raise SystemExit(0 if crawl() else 1)
