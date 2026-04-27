from __future__ import annotations

import random
import time
from typing import Any

import requests

from platform_auth import get_buff_header
from repository import record_site_update, upsert_buff_item


BUFF_URLS = [
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category_group=sticker&tab=selling&use_suggestion=0&_={}",
        "page": 300,
        "category": "sticker",
    }
]


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if payload.get("code") != "OK":
        print(f"BUFF sticker unexpected response: {payload.get('code') or payload}")
        return []
    data = payload.get("data") or {}
    items = data.get("items") or []
    return items if isinstance(items, list) else []


def crawl(url: str, headers: dict, category: str | None = None) -> int:
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        print(f"BUFF sticker request failed: {exc}")
        return 0

    saved = 0
    for raw in extract_items(payload):
        if upsert_buff_item(raw, category=category):
            saved += 1
            print(raw.get("market_hash_name"), raw.get("name"), raw.get("sell_min_price"))
    return saved


def main() -> int:
    headers = get_buff_header()
    if headers is None:
        return 2

    pages = 0
    saved = 0
    for item in BUFF_URLS:
        for page_num in range(1, int(item["page"]) + 1):
            timestamp = int(time.time() * 1000)
            url = str(item["url"]).format(page_num, timestamp)
            print(url)
            pages += 1
            saved += crawl(url, headers, category=item.get("category"))
            sleep_seconds = random.randint(4, 16)
            print("sleep", sleep_seconds)
            time.sleep(sleep_seconds)
            if page_num % 100 == 0:
                time.sleep(60 * 60 * 2)

    record_site_update("buff_sticker_update", "buff", {"pages": pages, "items": saved})
    print(f"buff_sticker pages={pages} items={saved}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
