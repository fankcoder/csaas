from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

try:
    from django_setup import setup_django
except ImportError:
    from .django_setup import setup_django

setup_django()

from django.utils import timezone  # noqa: E402

from price.models import ItemPlatformListing, Iteminfo, Price  # noqa: E402
from siteconfig.models import SiteSetting  # noqa: E402


EMPTY_VALUES = (None, "")


def decimal_or_none(value: Any) -> Decimal | None:
    if value in EMPTY_VALUES:
        return None
    try:
        return Decimal(str(value).replace(",", ""))
    except (InvalidOperation, ValueError):
        return None


def int_or_zero(value: Any) -> int:
    if value in EMPTY_VALUES:
        return 0
    try:
        return int(float(str(value).replace(",", "")))
    except (TypeError, ValueError):
        return 0


def first_present(mapping: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = mapping.get(key)
        if value not in EMPTY_VALUES:
            return value
    return None


def get_or_create_item(
    *,
    market_hash_name: str,
    market_name_cn: str | None = None,
    icon_url: str | None = None,
    category: str | None = None,
) -> Iteminfo:
    item, _created = Iteminfo.objects.get_or_create(
        market_hash_name=market_hash_name,
        defaults={
            "appid": "730",
            "name": market_hash_name,
            "market_name_cn": market_name_cn,
            "icon_url": icon_url,
            "category": category,
        },
    )

    updates: list[str] = []
    for field_name, value in {
        "name": market_hash_name,
        "market_name_cn": market_name_cn,
        "icon_url": icon_url,
        "category": category,
    }.items():
        if value in EMPTY_VALUES:
            continue
        current = getattr(item, field_name)
        if current in EMPTY_VALUES:
            setattr(item, field_name, value)
            updates.append(field_name)

    if updates:
        item.save(update_fields=updates)
    return item


def update_platform_listing(
    *,
    item: Iteminfo,
    platform: str,
    platform_item_id: Any,
    source_name: str | None = None,
) -> None:
    if platform_item_id in EMPTY_VALUES:
        return
    ItemPlatformListing.objects.update_or_create(
        iteminfo=item,
        platform=platform.upper(),
        defaults={
            "platform_item_id": str(platform_item_id),
            "source_name": source_name,
        },
    )


def update_price(item: Iteminfo, **fields: Any) -> Price:
    price, _created = Price.objects.get_or_create(iteminfo=item)
    update_fields: list[str] = []
    for field_name, value in fields.items():
        setattr(price, field_name, value)
        update_fields.append(field_name)
    if update_fields:
        price.save(update_fields=update_fields)
    return price


def record_site_update(key: str, platform: str, stats: dict[str, Any]) -> None:
    now = timezone.now()
    SiteSetting.objects.update_or_create(
        key=key,
        defaults={
            "value": {
                "platform": platform,
                "last_updated_at": now.isoformat(),
                **stats,
            },
            "description": f"{platform} price crawler status",
            "is_public": True,
        },
    )


def upsert_buff_item(raw: dict[str, Any], category: str | None = None) -> bool:
    goods_info = raw.get("goods_info") or {}
    market_hash_name = first_present(raw, "market_hash_name", "marketHashName") or first_present(
        goods_info,
        "market_hash_name",
        "marketHashName",
    )
    if not market_hash_name:
        return False

    now = timezone.now()
    item = get_or_create_item(
        market_hash_name=str(market_hash_name),
        market_name_cn=first_present(raw, "name", "market_name_cn", "marketNameCn"),
        icon_url=first_present(goods_info, "original_icon_url", "icon_url", "iconUrl"),
        category=category,
    )
    update_platform_listing(
        item=item,
        platform="BUFF",
        platform_item_id=first_present(raw, "id", "goods_id", "goodsId"),
        source_name=first_present(raw, "name", "market_name_cn"),
    )
    update_price(
        item,
        buff_id=int_or_zero(first_present(raw, "id", "goods_id", "goodsId")) or None,
        buff_buy_price=decimal_or_none(first_present(raw, "buy_max_price", "buyMaxPrice")),
        buff_buy_num=int_or_zero(first_present(raw, "buy_num", "buyNum")),
        buff_sell_price=decimal_or_none(first_present(raw, "sell_min_price", "sellMinPrice")),
        buff_sell_num=int_or_zero(first_present(raw, "sell_num", "sellNum")),
        buff_time=now,
        steam_price=decimal_or_none(first_present(goods_info, "steam_price", "steamPrice")),
        steam_price_cny=decimal_or_none(first_present(goods_info, "steam_price_cny", "steamPriceCny")),
        steam_time=now,
    )
    return True


def upsert_youpin_item(raw: dict[str, Any], category: str | None = None) -> bool:
    market_hash_name = first_present(
        raw,
        "CommodityHashName",
        "commodityHashName",
        "MarketHashName",
        "marketHashName",
    )
    if not market_hash_name:
        return False

    now = timezone.now()
    item = get_or_create_item(
        market_hash_name=str(market_hash_name),
        market_name_cn=first_present(raw, "CommodityName", "commodityName", "name"),
        category=category,
    )
    update_platform_listing(
        item=item,
        platform="YOUPIN",
        platform_item_id=first_present(raw, "Id", "id", "TemplateId", "templateId"),
        source_name=first_present(raw, "CommodityName", "commodityName", "name"),
    )
    update_price(
        item,
        uu_price=decimal_or_none(first_present(raw, "Price", "price", "SellPrice", "sellPrice")),
        uu_time=now,
    )
    return True


def upsert_waxpeer_item(raw: dict[str, Any]) -> bool:
    market_hash_name = first_present(raw, "name", "market_hash_name", "marketHashName")
    if not market_hash_name:
        return False

    now = timezone.now()
    item = get_or_create_item(market_hash_name=str(market_hash_name))
    update_price(
        item,
        wax_price=decimal_or_none(first_present(raw, "min", "min_price", "minPrice", "price")),
        wax_count=int_or_zero(first_present(raw, "count", "volume", "available")),
        wax_time=now,
    )
    return True


def upsert_shadowpay_item(raw: dict[str, Any]) -> bool:
    market_hash_name = first_present(
        raw,
        "steam_market_hash_name",
        "market_hash_name",
        "marketHashName",
        "name",
    )
    if not market_hash_name:
        return False

    now = timezone.now()
    item = get_or_create_item(market_hash_name=str(market_hash_name))
    update_price(
        item,
        shadow_price=decimal_or_none(first_present(raw, "price", "min_price", "minPrice")),
        shadow_sell_num=int_or_zero(first_present(raw, "volume", "count", "available")),
        shadow_time=timezone.localdate(now),
    )
    return True
