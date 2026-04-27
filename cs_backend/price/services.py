from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from django.conf import settings

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
            )
        )

    return quotes


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
    rows: list[dict[str, Any]] = []

    for buy in quotes:
        if buy_platform and buy.platform != buy_platform:
            continue
        if buy.volume < min_volume:
            continue
        for sell in quotes:
            if buy.platform == sell.platform:
                continue
            if sell_platform and sell.platform != sell_platform:
                continue
            if cross_group_only and buy.group == sell.group:
                continue
            if sell.volume < min_volume:
                continue

            sell_net = quant_money(sell.price_cny * (Decimal("1") - sell.sell_fee))
            profit_cny = quant_money(sell_net - buy.price_cny)
            if profit_cny <= min_profit:
                continue

            margin_pct = (profit_cny / buy.price_cny * Decimal("100")).quantize(
                PERCENT_QUANT,
                rounding=ROUND_HALF_UP,
            )
            if min_margin is not None and margin_pct < min_margin:
                continue

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
                    "buy_price_cny": buy.price_cny,
                    "buy_source_price": buy.source_price,
                    "buy_source_currency": buy.source_currency,
                    "buy_volume": buy.volume,
                    "sell_platform": sell.platform,
                    "sell_platform_label": sell.label,
                    "sell_group": sell.group,
                    "sell_price_cny": sell.price_cny,
                    "sell_source_price": sell.source_price,
                    "sell_source_currency": sell.source_currency,
                    "sell_volume": sell.volume,
                    "sell_fee_rate": sell.sell_fee,
                    "sell_net_cny": sell_net,
                    "profit_cny": profit_cny,
                    "margin_pct": margin_pct,
                    "buff_time": price.buff_time,
                    "wax_time": price.wax_time,
                    "shadow_time": price.shadow_time,
                }
            )

    return rows
