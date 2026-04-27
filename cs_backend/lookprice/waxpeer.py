from __future__ import annotations

from typing import Any

import requests

from repository import record_site_update, upsert_waxpeer_item


URL = "https://api.waxpeer.com/v1/prices?game=csgo&minified=1&highest_offer=0&single=0"


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if payload.get("success") not in (True, "true", 1, "1"):
        print(f"Waxpeer unexpected response: {payload.get('msg') or payload.get('message') or payload}")
        return []
    items = payload.get("items") or payload.get("data") or []
    return items if isinstance(items, list) else []


def crawl() -> int:
    try:
        response = requests.get(URL, timeout=60)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        print(f"Waxpeer request failed: {exc}")
        return 0

    saved = 0
    for raw in extract_items(payload):
        if upsert_waxpeer_item(raw):
            saved += 1
            print(raw.get("name") or raw.get("market_hash_name"), raw.get("min") or raw.get("price"))
    record_site_update("wax_update", "waxpeer", {"items": saved})
    print(f"waxpeer items={saved}")
    return saved


if __name__ == "__main__":
    raise SystemExit(0 if crawl() else 1)
