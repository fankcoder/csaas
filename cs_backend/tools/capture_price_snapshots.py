"""
Capture current platform prices into price_snapshot.

This script is intended for a 30-minute schedule:
    python tools/capture_price_snapshots.py --execute

Default mode is dry-run.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402
from django.utils import timezone  # noqa: E402

from price.models import Price, PriceSnapshot  # noqa: E402
from price.services import build_quotes, normalize_datetime  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capture current CS2 platform price snapshots.")
    parser.add_argument("--execute", action="store_true", help="Write snapshots to price_snapshot.")
    parser.add_argument("--chunk-size", type=int, default=1000)
    parser.add_argument("--bulk-size", type=int, default=1000)
    return parser.parse_args()


def half_hour_bucket(value):
    value = value.replace(second=0, microsecond=0)
    minute = 30 if value.minute >= 30 else 0
    return value.replace(minute=minute)


def main() -> int:
    args = parse_args()
    captured_at = half_hour_bucket(timezone.now())
    queryset = Price.objects.select_related("iteminfo").filter(iteminfo__isnull=False)
    pending = []
    scanned = 0
    generated = 0
    inserted = 0

    def flush():
        nonlocal pending, inserted
        if not pending:
            return
        PriceSnapshot.objects.bulk_create(pending, batch_size=args.bulk_size, ignore_conflicts=True)
        inserted += len(pending)
        pending = []

    with transaction.atomic():
        for price in queryset.iterator(chunk_size=args.chunk_size):
            scanned += 1
            for quote in build_quotes(price):
                generated += 1
                if not args.execute:
                    continue
                pending.append(
                    PriceSnapshot(
                        iteminfo=price.iteminfo,
                        platform=quote.platform,
                        platform_label=quote.label,
                        price_cny=quote.price_cny,
                        source_price=quote.source_price,
                        source_currency=quote.source_currency,
                        volume=quote.volume,
                        source_updated_at=normalize_datetime(quote.last_updated_at),
                        captured_at=captured_at,
                        raw_payload={
                            "sell_fee": str(quote.sell_fee),
                            "group": quote.group,
                            "is_liquid": quote.is_liquid,
                        },
                    )
                )
                if len(pending) >= args.bulk_size:
                    flush()
        if args.execute:
            flush()

    print(f"captured_at={captured_at.isoformat()}")
    print(f"scanned_prices={scanned}")
    print(f"generated_snapshots={generated}")
    print(f"inserted_attempted={inserted}")
    print(f"execute={args.execute}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
