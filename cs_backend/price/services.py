from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any
from urllib.parse import quote, quote_plus

from django.conf import settings
from django.utils import timezone

from .models import Price


MONEY_QUANT = Decimal("0.01")
PERCENT_QUANT = Decimal("0.01")


@dataclass(frozen=True)
class MarketQuote:
    platform: str
    label: str
    group: str
    price_cny: Decimal
    source_price: Decimal
    source_currency: str
    volume: int
    sell_fee: Decimal
    last_updated_at: Any = None
    is_liquid: bool = True


GROUP_LABELS = {
    "domestic": "国内市场",
    "foreign": "海外市场",
}

PLATFORM_ID_ALIASES = {
    "buff": ("BUFF",),
    "youpin": ("YOUPIN", "UU", "YOUPIN898"),
}

PLATFORM_UPDATE_FIELDS = {
    "buff": "buff_time",
    "youpin": "uu_time",
    "waxpeer": "wax_time",
    "shadowpay": "shadow_time",
}


def iso_datetime(value: Any) -> str | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            value = timezone.make_aware(value)
        return value.isoformat()
    if isinstance(value, date):
        return timezone.make_aware(datetime.combine(value, time.min)).isoformat()
    return str(value)


def normalize_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return timezone.make_aware(value) if timezone.is_naive(value) else value
    if isinstance(value, date):
        return timezone.make_aware(datetime.combine(value, time.min))
    return None


def current_platform_updated_at(item: Any, platform: str) -> Any:
    price = getattr(item, "price", None)
    if price is None:
        return None
    field_name = PLATFORM_UPDATE_FIELDS.get(platform.lower())
    return getattr(price, field_name, None) if field_name else None


def platform_listing_map(item: Any) -> dict[str, str]:
    if item is None or not getattr(item, "pk", None):
        return {}

    listings = getattr(item, "platform_listings", None)
    if listings is None:
        return {}

    return {
        str(listing.platform).upper(): str(listing.platform_item_id)
        for listing in listings.all()
        if listing.platform and listing.platform_item_id
    }


def platform_item_id(platform_item_ids: dict[str, str], platform: str) -> str | None:
    for alias in PLATFORM_ID_ALIASES.get(platform.lower(), (platform.upper(),)):
        item_id = platform_item_ids.get(alias)
        if item_id:
            return item_id
    return None


def platform_market_url(
    platform: str,
    market_hash_name: str | None,
    platform_item_ids: dict[str, str] | None = None,
) -> str | None:
    platform_key = platform.lower()
    name = market_hash_name or ""
    item_ids = platform_item_ids or {}

    if platform_key == "waxpeer" and name:
        return f"https://waxpeer.com/?search={quote(name, safe='')}&sort=ASC&order=price"

    if platform_key == "shadowpay" and name:
        return f"https://shadowpay.com/csgo-items?search={quote_plus(name, safe='|()')}"

    if platform_key == "buff" and name:
        return (
            "https://buff.163.com/market/csgo"
            f"#game=csgo&page_num=1&search={quote(name, safe='()')}&tab=selling"
        )

    if platform_key == "youpin":
        item_id = platform_item_id(item_ids, platform_key)
        if item_id:
            return (
                "https://www.youpin898.com/market/goods-list"
                f"?listType=10&templateId={quote(item_id, safe='')}&gameId=730"
            )

    return None


def enrich_quote_payloads(
    quotes: list[Any] | None,
    item: Any,
    *,
    selected_sell_platform: str | None = None,
    buy_price_cny: Decimal | None = None,
) -> list[Any]:
    if not quotes:
        return []

    market_hash_name = getattr(item, "market_hash_name", None)
    platform_item_ids = platform_listing_map(item)
    enriched = []

    for raw_quote in quotes:
        if not isinstance(raw_quote, dict):
            enriched.append(raw_quote)
            continue

        payload = dict(raw_quote)
        payload["market_url"] = platform_market_url(
            str(payload.get("platform", "")),
            market_hash_name,
            platform_item_ids,
        )
        if not payload.get("last_updated_at"):
            payload["last_updated_at"] = iso_datetime(
                current_platform_updated_at(item, str(payload.get("platform", "")))
            )
        if selected_sell_platform:
            payload["is_selected_sell"] = payload.get("platform") == selected_sell_platform

        if buy_price_cny is not None:
            net_price_cny = decimal_or_none(payload.get("net_price_cny"))
            if net_price_cny is not None:
                profit_cny = quant_money(net_price_cny - buy_price_cny)
                payload["profit_cny"] = str(profit_cny)
                payload["margin_pct"] = str(
                    (profit_cny / buy_price_cny * Decimal("100")).quantize(
                        PERCENT_QUANT,
                        rounding=ROUND_HALF_UP,
                    )
                )
        enriched.append(payload)

    return enriched


def decimal_or_none(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    if number <= 0:
        return None
    return number


def quant_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def get_fee(platform: str) -> Decimal:
    return Decimal(str(settings.MARKET_SELL_FEES.get(platform, "0")))


def group_label(group: str) -> str:
    return GROUP_LABELS.get(group, group)


def volume_score(volume: int) -> int:
    if volume >= 100:
        return 35
    if volume >= 50:
        return 30
    if volume >= 20:
        return 24
    if volume >= 10:
        return 18
    if volume >= 5:
        return 12
    if volume >= 1:
        return 6
    return 0


def freshness_score(calculated_at: Any = None) -> int:
    if not calculated_at:
        return 10
    if timezone.is_naive(calculated_at):
        calculated_at = timezone.make_aware(calculated_at)
    age_hours = max((timezone.now() - calculated_at).total_seconds() / 3600, 0)
    if age_hours <= 6:
        return 20
    if age_hours <= 24:
        return 15
    if age_hours <= 72:
        return 8
    return 2


def liquidity_score(
    *,
    buy_volume: int,
    sell_volume: int,
    platform_count: int,
    margin_pct: Decimal,
    calculated_at: Any = None,
) -> int:
    volume_points = min(volume_score(buy_volume), volume_score(sell_volume))
    coverage_points = min(platform_count * 6, 25)
    margin_points = 20 if margin_pct >= 10 else 15 if margin_pct >= 5 else 10 if margin_pct >= 2 else 5
    return max(0, min(100, volume_points + coverage_points + margin_points + freshness_score(calculated_at)))


def risk_flags(
    *,
    buy_volume: int,
    sell_volume: int,
    platform_count: int,
    margin_pct: Decimal,
    calculated_at: Any = None,
) -> list[str]:
    flags: list[str] = []
    if min(buy_volume, sell_volume) < 5:
        flags.append("low_volume")
    if platform_count < 2:
        flags.append("single_market")
    if margin_pct > 100:
        flags.append("abnormal_margin")
    if calculated_at:
        if timezone.is_naive(calculated_at):
            calculated_at = timezone.make_aware(calculated_at)
        if (timezone.now() - calculated_at).total_seconds() > 24 * 3600:
            flags.append("stale_data")
    return flags


def opportunity_quality_payload(
    *,
    buy_volume: int,
    sell_volume: int,
    platform_count: int,
    margin_pct: Decimal,
    calculated_at: Any = None,
) -> dict[str, Any]:
    return {
        "liquidity_score": liquidity_score(
            buy_volume=buy_volume,
            sell_volume=sell_volume,
            platform_count=platform_count,
            margin_pct=margin_pct,
            calculated_at=calculated_at,
        ),
        "risk_flags": risk_flags(
            buy_volume=buy_volume,
            sell_volume=sell_volume,
            platform_count=platform_count,
            margin_pct=margin_pct,
            calculated_at=calculated_at,
        ),
    }


def get_usd_cny_rate(override: Any = None) -> Decimal:
    value = override if override not in (None, "") else settings.USD_CNY_RATE
    rate = decimal_or_none(value)
    return rate or Decimal("7.25")


def wax_raw_to_usd(raw_price: Decimal) -> Decimal:
    # Waxpeer stores 27472.00 as about 27.47 USD in the source table.
    return raw_price / Decimal("1000")


def build_quotes(price: Price, usd_cny_rate: Decimal | None = None) -> list[MarketQuote]:
    rate = usd_cny_rate or get_usd_cny_rate()
    quotes: list[MarketQuote] = []

    buff_price = decimal_or_none(price.buff_sell_price)
    if buff_price is not None:
        quotes.append(
            MarketQuote(
                platform="buff",
                label="BUFF",
                group="domestic",
                price_cny=quant_money(buff_price),
                source_price=quant_money(buff_price),
                source_currency="CNY",
                volume=price.buff_sell_num or 0,
                sell_fee=get_fee("buff"),
                last_updated_at=price.buff_time,
                is_liquid=(price.buff_sell_num or 0) > 0,
            )
        )

    youpin_price = decimal_or_none(price.uu_price)
    if youpin_price is not None:
        quotes.append(
            MarketQuote(
                platform="youpin",
                label="悠悠有品",
                group="domestic",
                price_cny=quant_money(youpin_price),
                source_price=quant_money(youpin_price),
                source_currency="CNY",
                volume=0,
                sell_fee=get_fee("youpin"),
                last_updated_at=price.uu_time,
                is_liquid=False,
            )
        )

    c5_price = decimal_or_none(price.c5_price)
    if c5_price is not None:
        quotes.append(
            MarketQuote(
                platform="c5",
                label="C5",
                group="domestic",
                price_cny=quant_money(c5_price),
                source_price=quant_money(c5_price),
                source_currency="CNY",
                volume=0,
                sell_fee=get_fee("c5"),
                last_updated_at=None,
                is_liquid=False,
            )
        )

    wax_raw = decimal_or_none(price.wax_price)
    if wax_raw is not None:
        wax_usd = wax_raw_to_usd(wax_raw)
        quotes.append(
            MarketQuote(
                platform="waxpeer",
                label="Waxpeer",
                group="foreign",
                price_cny=quant_money(wax_usd * rate),
                source_price=quant_money(wax_usd),
                source_currency="USD",
                volume=price.wax_count or 0,
                sell_fee=get_fee("waxpeer"),
                last_updated_at=price.wax_time,
                is_liquid=(price.wax_count or 0) > 0,
            )
        )

    shadow_usd = decimal_or_none(price.shadow_price)
    if shadow_usd is not None:
        quotes.append(
            MarketQuote(
                platform="shadowpay",
                label="ShadowPay",
                group="foreign",
                price_cny=quant_money(shadow_usd * rate),
                source_price=quant_money(shadow_usd),
                source_currency="USD",
                volume=price.shadow_sell_num or 0,
                sell_fee=get_fee("shadowpay"),
                last_updated_at=price.shadow_time,
                is_liquid=(price.shadow_sell_num or 0) > 0,
            )
        )

    return quotes


def quote_net_cny(quote: MarketQuote) -> Decimal:
    return quant_money(quote.price_cny * (Decimal("1") - quote.sell_fee))


def quote_payload(
    quote: MarketQuote,
    *,
    min_volume: int,
    best_buy_platform: str | None = None,
    best_sell_platform: str | None = None,
    selected_sell_platform: str | None = None,
    buy_price_cny: Decimal | None = None,
    market_hash_name: str | None = None,
    platform_item_ids: dict[str, str] | None = None,
) -> dict[str, Any]:
    net_price_cny = quote_net_cny(quote)
    profit_cny = None
    margin_pct = None
    if buy_price_cny is not None:
        profit_cny = quant_money(net_price_cny - buy_price_cny)
        if buy_price_cny > 0:
            margin_pct = (profit_cny / buy_price_cny * Decimal("100")).quantize(
                PERCENT_QUANT,
                rounding=ROUND_HALF_UP,
            )

    return {
        "platform": quote.platform,
        "label": quote.label,
        "group": quote.group,
        "group_label": group_label(quote.group),
        "price_cny": str(quote.price_cny),
        "source_price": str(quote.source_price),
        "source_currency": quote.source_currency,
        "volume": quote.volume,
        "last_updated_at": iso_datetime(quote.last_updated_at),
        "sell_fee": str(quote.sell_fee),
        "net_price_cny": str(net_price_cny),
        "profit_cny": str(profit_cny) if profit_cny is not None else None,
        "margin_pct": str(margin_pct) if margin_pct is not None else None,
        "eligible": quote.volume >= min_volume,
        "is_best_buy": quote.platform == best_buy_platform,
        "is_best_sell": quote.platform == best_sell_platform,
        "is_selected_sell": quote.platform == selected_sell_platform,
        "market_url": platform_market_url(quote.platform, market_hash_name, platform_item_ids),
    }


def opportunity_rows(
    price: Price,
    *,
    usd_cny_rate: Decimal | None = None,
    min_volume: int = 1,
    min_profit: Decimal = Decimal("0"),
    min_margin: Decimal | None = None,
    buy_platform: str | None = None,
    sell_platform: str | None = None,
    cross_group_only: bool = True,
) -> list[dict[str, Any]]:
    item = price.iteminfo
    if item is None:
        return []

    quotes = build_quotes(price, usd_cny_rate=usd_cny_rate)
    platform_item_ids = platform_listing_map(item)
    rows: list[dict[str, Any]] = []

    groups = sorted({quote.group for quote in quotes})
    for buy_group in groups:
        for sell_group in groups:
            if cross_group_only and buy_group == sell_group:
                continue

            buy_group_quotes = [
                quote for quote in quotes if quote.group == buy_group and (not buy_platform or quote.platform == buy_platform)
            ]
            sell_group_quotes = [
                quote for quote in quotes if quote.group == sell_group and (not sell_platform or quote.platform == sell_platform)
            ]
            buy_candidates = [quote for quote in buy_group_quotes if quote.volume >= min_volume]
            sell_candidates = [quote for quote in sell_group_quotes if quote.volume >= min_volume]
            if not buy_candidates or not sell_candidates:
                continue

            buy = min(buy_candidates, key=lambda quote: quote.price_cny)
            sell_candidates = [quote for quote in sell_candidates if quote.platform != buy.platform]
            if not sell_candidates:
                continue

            best_sell = max(sell_candidates, key=quote_net_cny)

            for sell in sorted(sell_candidates, key=quote_net_cny, reverse=True):
                sell_net = quote_net_cny(sell)
                profit_cny = quant_money(sell_net - buy.price_cny)
                if profit_cny <= min_profit:
                    continue

                margin_pct = (profit_cny / buy.price_cny * Decimal("100")).quantize(
                    PERCENT_QUANT,
                    rounding=ROUND_HALF_UP,
                )
                if min_margin is not None and margin_pct < min_margin:
                    continue

                platform_count = len({quote.platform for quote in buy_group_quotes + sell_group_quotes})
                quality_payload = opportunity_quality_payload(
                    buy_volume=buy.volume,
                    sell_volume=sell.volume,
                    platform_count=platform_count,
                    margin_pct=margin_pct,
                )

                rows.append(
                    {
                        "iteminfo_id": item.id,
                        "market_hash_name": item.market_hash_name,
                        "market_name_cn": item.market_name_cn,
                        "icon_url": item.icon_url,
                        "quality": item.quality,
                        "quality_color": item.quality_color,
                        "category": item.category,
                        "buy_platform": buy.platform,
                        "buy_platform_label": buy.label,
                        "buy_group": buy.group,
                        "buy_group_label": group_label(buy.group),
                        "buy_price_cny": buy.price_cny,
                        "buy_source_price": buy.source_price,
                        "buy_source_currency": buy.source_currency,
                        "buy_volume": buy.volume,
                        "buy_quotes": [
                            quote_payload(
                                quote,
                                min_volume=min_volume,
                                best_buy_platform=buy.platform,
                                market_hash_name=item.market_hash_name,
                                platform_item_ids=platform_item_ids,
                            )
                            for quote in sorted(buy_group_quotes, key=lambda quote: quote.price_cny)
                        ],
                        "sell_platform": sell.platform,
                        "sell_platform_label": sell.label,
                        "sell_group": sell.group,
                        "sell_group_label": group_label(sell.group),
                        "sell_price_cny": sell.price_cny,
                        "sell_source_price": sell.source_price,
                        "sell_source_currency": sell.source_currency,
                        "sell_volume": sell.volume,
                        "sell_fee_rate": sell.sell_fee,
                        "sell_net_cny": sell_net,
                        "sell_quotes": [
                            quote_payload(
                                quote,
                                min_volume=min_volume,
                                best_sell_platform=best_sell.platform,
                                selected_sell_platform=sell.platform,
                                buy_price_cny=buy.price_cny,
                                market_hash_name=item.market_hash_name,
                                platform_item_ids=platform_item_ids,
                            )
                            for quote in sorted(sell_group_quotes, key=quote_net_cny, reverse=True)
                        ],
                        "profit_cny": profit_cny,
                        "margin_pct": margin_pct,
                        **quality_payload,
                        "buff_time": price.buff_time,
                        "wax_time": price.wax_time,
                        "shadow_time": price.shadow_time,
                    }
                )

    return rows
