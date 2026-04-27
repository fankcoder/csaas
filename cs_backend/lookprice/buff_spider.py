from __future__ import annotations

import random
import time
from typing import Any

import requests

from platform_auth import get_buff_header
from repository import record_site_update, upsert_buff_item


BUFF_URLS = [
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_ak47&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 10,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_awp&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 6,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_m4a1_silencer&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 7,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_m4a1&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 7,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_deagle&min_price=100&max_price=1000&quality=normal&use_suggestion=0&_={}",
        "page": 4,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_usp_silencer&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 7,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category=weapon_glock&min_price=100&max_price=1500&quality=normal&use_suggestion=0&_={}",
        "page": 4,
        "category": "weapon",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category_group=knife&min_price=1000&max_price=4000&quality=unusual&sort_by=sell_num.desc&tab=selling&use_suggestion=0&_={}",
        "page": 20,
        "category": "knife",
    },
    {
        "url": "https://buff.163.com/api/market/goods?game=csgo&page_num={}&category_group=hands&min_price=1000&max_price=4000&quality=unusual&sort_by=sell_num.desc&tab=selling&use_suggestion=0&_={}",
        "page": 7,
        "category": "hands",
    },
]


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if payload.get("code") != "OK":
        print(f"BUFF unexpected response: {payload.get('code') or payload.get('error') or payload}")
        return []
    data = payload.get("data") or {}
    items = data.get("items") or data.get("goods") or []
    return items if isinstance(items, list) else []


def crawl(url: str, headers: dict, category: str | None = None) -> int:
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        print(f"BUFF request failed: {exc}")
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

    fetched = 0
    saved = 0
    for item in BUFF_URLS:
        for page_num in range(1, int(item["page"]) + 1):
            timestamp = int(time.time() * 1000)
            url = str(item["url"]).format(page_num, timestamp)
            print(url)
            fetched += 1
            saved += crawl(url, headers, category=item.get("category"))
            sleep_seconds = random.randint(2, 8)
            print("sleep", sleep_seconds)
            time.sleep(sleep_seconds)

    record_site_update("buff_update", "buff", {"pages": fetched, "items": saved})
    print(f"buff pages={fetched} items={saved}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
