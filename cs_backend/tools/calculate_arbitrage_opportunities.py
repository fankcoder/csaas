"""
Calculate arbitrage opportunities into the arbitrage_opportunity table.

Default mode is dry-run. Add --execute to rebuild the derived profit table.

Examples:
    python tools/calculate_arbitrage_opportunities.py
    python tools/calculate_arbitrage_opportunities.py --execute
    python tools/calculate_arbitrage_opportunities.py --execute --min-volume 5 --min-profit 10
"""

from __future__ import annotations

import argparse
import heapq
import os
import sys
from decimal import Decimal
from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402
from django.utils import timezone  # noqa: E402

from price.models import ArbitrageOpportunity, Price  # noqa: E402
from price.services import decimal_or_none, get_usd_cny_rate, opportunity_rows  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calculate CS2 arbitrage opportunities.")
    parser.add_argument("--execute", action="store_true", help="Write results to arbitrage_opportunity.")
    parser.add_argument("--min-volume", type=int, default=1, help="Minimum volume required on both directions.")
    parser.add_argument("--min-profit", default="0", help="Minimum profit in CNY.")
    parser.add_argument("--min-margin", default=None, help="Minimum margin percentage.")
    parser.add_argument("--usd-cny-rate", default=None, help="Override USD/CNY rate.")
    parser.add_argument("--buy-platform", default=None, help="Only calculate this direction A platform.")
    parser.add_argument("--sell-platform", default=None, help="Only calculate this direction B platform.")
    parser.add_argument(
        "--include-same-group",
        action="store_true",
        help="Also calculate domestic-domestic or foreign-foreign opportunities.",
    )
    parser.add_argument("--chunk-size", type=int, default=1000, help="Database iterator chunk size.")
    parser.add_argument("--bulk-size", type=int, default=1000, help="Bulk insert batch size.")
    return parser.parse_args()


def to_opportunity(row: dict, batch_id: str, calculated_at, usd_cny_rate: Decimal, min_volume: int):
    return ArbitrageOpportunity(
        iteminfo_id=row["iteminfo_id"],
        direction_a_platform=row["buy_platform"],
        direction_a_platform_label=row["buy_platform_label"],
        direction_a_group=row["buy_group"],
        direction_a_price_cny=row["buy_price_cny"],
        direction_a_source_price=row["buy_source_price"],
        direction_a_source_currency=row["buy_source_currency"],
        direction_a_volume=row["buy_volume"],
        direction_b_platform=row["sell_platform"],
        direction_b_platform_label=row["sell_platform_label"],
        direction_b_group=row["sell_group"],
        direction_b_price_cny=row["sell_price_cny"],
        direction_b_source_price=row["sell_source_price"],
        direction_b_source_currency=row["sell_source_currency"],
        direction_b_volume=row["sell_volume"],
        direction_b_fee_rate=row["sell_fee_rate"],
        direction_b_net_cny=row["sell_net_cny"],
        profit_cny=row["profit_cny"],
        margin_pct=row["margin_pct"],
        usd_cny_rate=usd_cny_rate,
        min_volume=min_volume,
        calculation_batch_id=batch_id,
        calculated_at=calculated_at,
    )


def push_top(top_rows: list[tuple[Decimal, int, dict]], row: dict, sequence: int, limit: int = 10) -> None:
    item = (row["profit_cny"], sequence, row)
    if len(top_rows) < limit:
        heapq.heappush(top_rows, item)
        return
    if row["profit_cny"] > top_rows[0][0]:
        heapq.heapreplace(top_rows, item)


def print_top(top_rows: list[tuple[Decimal, int, dict]]) -> None:
    print("top_opportunities:")
    for profit, _sequence, row in sorted(top_rows, key=lambda item: item[0], reverse=True):
        print(
            f"  profit={profit} margin={row['margin_pct']}% "
            f"{row['buy_platform_label']}->{row['sell_platform_label']} "
            f"{row['market_hash_name']}"
        )


def main() -> int:
    args = parse_args()
    min_profit = decimal_or_none(args.min_profit) or Decimal("0")
    min_margin = decimal_or_none(args.min_margin)
    usd_cny_rate = get_usd_cny_rate(args.usd_cny_rate)
    batch_id = str(uuid4())
    calculated_at = timezone.now()
    cross_group_only = not args.include_same_group

    queryset = Price.objects.select_related("iteminfo").filter(iteminfo__isnull=False)
    scanned = 0
    generated = 0
    inserted = 0
    pending = []
    top_rows: list[tuple[Decimal, int, dict]] = []

    def flush() -> None:
        nonlocal inserted, pending
        if not pending:
            return
        ArbitrageOpportunity.objects.bulk_create(pending, batch_size=args.bulk_size)
        inserted += len(pending)
        pending = []

    with transaction.atomic():
        if args.execute:
            deleted_count, _ = ArbitrageOpportunity.objects.all().delete()
            print(f"deleted_existing={deleted_count}")

        for price in queryset.iterator(chunk_size=args.chunk_size):
            scanned += 1
            rows = opportunity_rows(
                price,
                usd_cny_rate=usd_cny_rate,
                min_volume=args.min_volume,
                min_profit=min_profit,
                min_margin=min_margin,
                buy_platform=args.buy_platform,
                sell_platform=args.sell_platform,
                cross_group_only=cross_group_only,
            )
            generated += len(rows)

            for row in rows:
                push_top(top_rows, row, generated)
                if args.execute:
                    pending.append(
                        to_opportunity(
                            row=row,
                            batch_id=batch_id,
                            calculated_at=calculated_at,
                            usd_cny_rate=usd_cny_rate,
                            min_volume=args.min_volume,
                        )
                    )
                    if len(pending) >= args.bulk_size:
                        flush()

        if args.execute:
            flush()

    print(f"batch_id={batch_id}")
    print(f"calculated_at={calculated_at.isoformat()}")
    print(f"usd_cny_rate={usd_cny_rate}")
    print(f"min_volume={args.min_volume}")
    print(f"scanned_prices={scanned}")
    print(f"generated_opportunities={generated}")
    print(f"inserted_opportunities={inserted}")
    print(f"execute={args.execute}")
    print_top(top_rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
