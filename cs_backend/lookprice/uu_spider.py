from __future__ import annotations

import copy
import random
import time
from typing import Any

import requests

from platform_auth import get_uu_header
from repository import record_site_update, upsert_youpin_item


BASE_URL = "https://api.youpin898.com/api/homepage/new/es/template/GetCsGoPagedList"

BASE_PAYLOAD = {
    "filterMap": {
        "Type": ["weapon_ak47"],
        "Quality": ["normal"],
    },
    "gameId": 730,
    "listSortType": 0,
    "listType": 10,
    "maxPrice": "3000",
    "minPrice": "100",
    "pageIndex": 1,
    "pageSize": 100,
    "propertyFilterTags": [],
    "sortType": 0,
    "stickerAbrade": 0,
    "stickersIsSort": False,
    "Sessionid": "Zt/RvRTPvpIDANJ+y2NUZqX8",
}

UU_URLS = [
    {"weapon": "weapon_ak47", "category": "normal", "page": 1},
    {"weapon": "weapon_awp", "category": "normal", "page": 1},
    {"weapon": "weapon_m4a1", "category": "normal", "page": 1},
    {"weapon": "weapon_m4a1_silencer", "category": "normal", "page": 1},
    {"weapon": "weapon_deagle", "category": "normal", "page": 1},
    {"weapon": "weapon_usp_silencer", "category": "normal", "page": 1},
    {"weapon": "weapon_glock", "category": "normal", "page": 1},
    {
        "weapon": "CSGO_Type_Knife_Unlimited",
        "category": "unusual",
        "page": 2,
        "maxPrice": "20000",
        "minPrice": "5000",
        "item_category": "knife",
    },
    {
        "weapon": "Type_Hands_Unlimited",
        "category": "unusual",
        "page": 2,
        "maxPrice": "20000",
        "minPrice": "1000",
        "item_category": "hands",
    },
]


def response_code(payload: dict[str, Any]) -> Any:
    return payload.get("Code", payload.get("code"))


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    code = response_code(payload)
    if code not in (0, "0", "OK", "ok", True):
        print(f"YouPin unexpected response: {code} {payload.get('Msg') or payload.get('message') or ''}")
        return []

    data = payload.get("Data", payload.get("data"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("Data", "data", "Items", "items", "List", "list", "records"):
            value = data.get(key)
            if isinstance(value, list):
                return value
    return []


def build_payload(config: dict[str, Any], page_index: int) -> dict[str, Any]:
    payload = copy.deepcopy(BASE_PAYLOAD)
    category = config.get("category")
    payload["filterMap"]["Type"] = [config["weapon"]]
    if category:
        payload["filterMap"]["Quality"] = [category]
    if config.get("maxPrice"):
        payload["maxPrice"] = config["maxPrice"]
    if config.get("minPrice"):
        payload["minPrice"] = config["minPrice"]
    payload["pageIndex"] = page_index
    return payload


def crawl(payload: dict[str, Any], headers: dict, category: str | None = None) -> int:
    try:
        response = requests.post(BASE_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        response_payload = response.json()
    except Exception as exc:
        print(f"YouPin request failed: {exc}")
        return 0

    saved = 0
    for raw in extract_items(response_payload):
        if upsert_youpin_item(raw, category=category):
            saved += 1
            print(raw.get("CommodityHashName") or raw.get("commodityHashName"), raw.get("Price") or raw.get("price"))
    return saved


def main() -> int:
    headers = get_uu_header()
    if headers is None:
        return 2

    fetched = 0
    saved = 0
    for config in UU_URLS:
        for page_index in range(1, int(config["page"]) + 1):
            payload = build_payload(config, page_index)
            fetched += 1
            saved += crawl(payload, headers, category=config.get("item_category"))
            sleep_seconds = random.randint(2, 8)
            print("sleep", sleep_seconds)
            time.sleep(sleep_seconds)

    record_site_update("uu_update", "youpin", {"pages": fetched, "items": saved})
    print(f"youpin pages={fetched} items={saved}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
