from __future__ import annotations

import random
import time
from typing import Any

import requests

from platform_auth import get_buff_header
from django_setup import setup_django
from repository import get_or_create_item

setup_django()

from price.models import Iteminfo  # noqa: E402


URL = "https://buff.163.com/api/market/goods"


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if payload.get("code") != "OK":
        print(f"BUFF by name unexpected response: {payload.get('code') or payload}")
        return []
    data = payload.get("data") or {}
    items = data.get("items") or []
    return items if isinstance(items, list) else []


def crawl(headers: dict, name: str, timestamp: int) -> bool:
    params = {
        "game": "csgo",
        "page_num": 1,
        "category_group": "sticker",
        "search": name,
        "tab": "selling",
        "use_suggestion": 0,
        "_": timestamp,
    }
    try:
        response = requests.get(URL, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        print(f"BUFF by name request failed: {exc}")
        return False

    for raw in extract_items(payload):
        if raw.get("name") != name:
            continue
        goods_info = raw.get("goods_info") or {}
        market_hash_name = raw.get("market_hash_name")
        if not market_hash_name:
            return False
        get_or_create_item(
            market_hash_name=market_hash_name,
            market_name_cn=raw.get("name"),
            category="sticker",
            icon_url=goods_info.get("original_icon_url") or goods_info.get("icon_url"),
        )
        print(raw.get("market_hash_name"), raw.get("name"))
        return True
    return False


def main() -> int:
    headers = get_buff_header()
    if headers is None:
        return 2

    queryset = Iteminfo.objects.filter(category="sticker", icon_url__isnull=True).exclude(market_name_cn__isnull=True)
    updated = 0
    for index, item in enumerate(queryset.iterator(chunk_size=200), start=1):
        print(item.market_name_cn)
        if crawl(headers, item.market_name_cn, int(time.time() * 1000)):
            updated += 1
        sleep_seconds = random.randint(4, 16)
        print("sleep", sleep_seconds)
        time.sleep(sleep_seconds)
        print("num:", index)
        if index % 100 == 0:
            time.sleep(60 * 60 * 2)

    print(f"buff_by_name updated={updated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
