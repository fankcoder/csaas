"""
Import all_item_data.json into iteminfo and item_platform_listing.

The source format is inferred from:
{
  "success": true,
  "data": [
    {
      "name": "...",
      "marketHashName": "...",
      "platformList": [{"name": "BUFF", "itemId": "34123"}]
    }
  ]
}

The importer streams the `data` array one item at a time and does not load the
whole JSON document into memory.

Examples:
    python tools/import_all_item_data.py
    python tools/import_all_item_data.py --execute
    python tools/import_all_item_data.py --execute --replace
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.db import connection, transaction  # noqa: E402
from django.utils import timezone  # noqa: E402

from price.models import ItemPlatformListing, Iteminfo  # noqa: E402


DEFAULT_SOURCE = BASE_DIR / "tools" / "all_item_data.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import platform item ids from all_item_data.json.")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Path to all_item_data.json.")
    parser.add_argument("--execute", action="store_true", help="Write to database. Default is dry-run.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing item_platform_listing rows before import. Requires --execute.",
    )
    parser.add_argument("--limit", type=int, default=0, help="Only process first N items. Useful for testing.")
    parser.add_argument("--progress-every", type=int, default=5000, help="Print progress every N parsed items.")
    parser.add_argument("--batch-size", type=int, default=2000, help="Bulk upsert batch size.")
    return parser.parse_args()


def iter_data_objects(path: Path):
    marker = '"data"'
    buffer = ""
    with path.open("r", encoding="utf-8-sig") as file:
        while marker not in buffer:
            chunk = file.read(8192)
            if not chunk:
                raise RuntimeError('Cannot find "data" array in source JSON.')
            buffer += chunk
            if len(buffer) > 1_000_000:
                buffer = buffer[-len(marker) - 8192 :]

        marker_index = buffer.index(marker) + len(marker)
        bracket_index = buffer.find("[", marker_index)
        while bracket_index == -1:
            chunk = file.read(8192)
            if not chunk:
                raise RuntimeError('Cannot find opening "[" for data array.')
            buffer += chunk
            bracket_index = buffer.find("[", marker_index)

        pending = buffer[bracket_index + 1 :]
        object_chars: list[str] = []
        depth = 0
        in_string = False
        escaped = False

        while True:
            if not pending:
                chunk = file.read(8192)
                if not chunk:
                    break
                pending = chunk

            char = pending[0]
            pending = pending[1:]

            if depth == 0:
                if char.isspace() or char == ",":
                    continue
                if char == "]":
                    return
                if char != "{":
                    continue
                object_chars = [char]
                depth = 1
                in_string = False
                escaped = False
                continue

            object_chars.append(char)

            if escaped:
                escaped = False
                continue
            if char == "\\" and in_string:
                escaped = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    yield json.loads("".join(object_chars))
                    object_chars = []


def normalize_platform(value: str) -> str:
    return value.strip().upper()


def load_item_map() -> tuple[dict[str, int], dict[str, Iteminfo]]:
    item_ids: dict[str, int] = {}
    item_objects: dict[str, Iteminfo] = {}
    queryset = Iteminfo.objects.only("id", "appid", "name", "market_hash_name", "market_name_cn").order_by("id")
    for item in queryset.iterator(chunk_size=5000):
        if item.market_hash_name not in item_ids:
            item_ids[item.market_hash_name] = item.id
            item_objects[item.market_hash_name] = item
    return item_ids, item_objects


def collect_iteminfo_changes(path: Path, limit: int = 0, progress_every: int = 0):
    item_ids, item_objects = load_item_map()
    new_items: dict[str, Iteminfo] = {}
    update_items: dict[int, Iteminfo] = {}
    parsed_items = 0
    skipped_items = 0
    platform_listings = 0

    for record in iter_data_objects(path):
        parsed_items += 1
        market_hash_name = (record.get("marketHashName") or "").strip()
        source_name = (record.get("name") or "").strip()
        platforms = valid_platforms(record)
        if not market_hash_name or not platforms:
            skipped_items += 1
        else:
            platform_listings += len(platforms)
            if market_hash_name not in item_ids and market_hash_name not in new_items:
                new_items[market_hash_name] = Iteminfo(
                    appid="730",
                    name=source_name or None,
                    market_hash_name=market_hash_name,
                    market_name_cn=source_name or None,
                )
            elif market_hash_name in item_objects and source_name:
                item = item_objects[market_hash_name]
                changed = False
                if not item.appid:
                    item.appid = "730"
                    changed = True
                if not item.name:
                    item.name = source_name
                    changed = True
                if not item.market_name_cn:
                    item.market_name_cn = source_name
                    changed = True
                if changed:
                    update_items[item.id] = item

        if progress_every and parsed_items % progress_every == 0:
            print(f"scanned_items={parsed_items} platform_listings={platform_listings}")
        if limit and parsed_items >= limit:
            break

    return item_ids, new_items, update_items, parsed_items, skipped_items, platform_listings


def refresh_item_ids(market_hash_names: list[str], item_ids: dict[str, int]) -> None:
    if not market_hash_names:
        return
    queryset = Iteminfo.objects.filter(market_hash_name__in=market_hash_names).order_by("id")
    for item in queryset:
        item_ids.setdefault(item.market_hash_name, item.id)


def valid_platforms(record: dict) -> list[dict]:
    platform_list = record.get("platformList") or []
    return [
        platform
        for platform in platform_list
        if (platform.get("name") or "").strip() and str(platform.get("itemId") or "").strip()
    ]


def upsert_item(record: dict, execute: bool) -> tuple[Iteminfo | None, bool, bool]:
    market_hash_name = (record.get("marketHashName") or "").strip()
    source_name = (record.get("name") or "").strip()
    if not market_hash_name:
        return None, False, False

    if not execute:
        return None, False, False

    item = Iteminfo.objects.filter(market_hash_name=market_hash_name).order_by("id").first()
    created = False
    updated = False
    if item is None:
        item = Iteminfo.objects.create(
            appid="730",
            name=source_name or None,
            market_hash_name=market_hash_name,
            market_name_cn=source_name or None,
        )
        created = True
    else:
        fields = []
        if source_name and not item.market_name_cn:
            item.market_name_cn = source_name
            fields.append("market_name_cn")
        if source_name and not item.name:
            item.name = source_name
            fields.append("name")
        if not item.appid:
            item.appid = "730"
            fields.append("appid")
        if fields:
            item.save(update_fields=fields)
            updated = True
    return item, created, updated


def import_record(record: dict, execute: bool) -> tuple[int, bool, bool, int]:
    platform_list = record.get("platformList") or []
    valid_platforms = [
        platform
        for platform in platform_list
        if (platform.get("name") or "").strip() and str(platform.get("itemId") or "").strip()
    ]
    if not record.get("marketHashName") or not valid_platforms:
        return 0, False, False, 1

    item, created, updated = upsert_item(record, execute=execute)
    if not execute:
        return len(valid_platforms), False, False, 0

    source_name = (record.get("name") or "").strip()
    listing_count = 0
    for platform in valid_platforms:
        platform_name = normalize_platform(platform["name"])
        platform_item_id = str(platform["itemId"]).strip()
        ItemPlatformListing.objects.update_or_create(
            iteminfo=item,
            platform=platform_name,
            defaults={
                "platform_item_id": platform_item_id,
                "source_name": source_name or None,
            },
        )
        listing_count += 1
    return listing_count, created, updated, 0


def flush_listing_rows(rows: list[tuple]) -> int:
    if not rows:
        return 0
    with connection.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO item_platform_listing
                (iteminfo_id, platform, platform_item_id, source_name, imported_at)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                platform_item_id = VALUES(platform_item_id),
                source_name = VALUES(source_name),
                imported_at = VALUES(imported_at)
            """,
            rows,
        )
        return cursor.rowcount


def import_listing_rows(
    path: Path,
    item_ids: dict[str, int],
    *,
    limit: int = 0,
    progress_every: int = 0,
    batch_size: int = 2000,
) -> tuple[int, int]:
    parsed_items = 0
    listing_count = 0
    affected_rows = 0
    rows: list[tuple] = []

    for record in iter_data_objects(path):
        parsed_items += 1
        market_hash_name = (record.get("marketHashName") or "").strip()
        item_id = item_ids.get(market_hash_name)
        if item_id:
            source_name = (record.get("name") or "").strip() or None
            imported_at = timezone.now()
            for platform in valid_platforms(record):
                rows.append(
                    (
                        item_id,
                        normalize_platform(platform["name"]),
                        str(platform["itemId"]).strip(),
                        source_name,
                        imported_at,
                    )
                )
                listing_count += 1
                if len(rows) >= batch_size:
                    affected_rows += flush_listing_rows(rows)
                    rows = []

        if progress_every and parsed_items % progress_every == 0:
            print(f"imported_scan_items={parsed_items} listing_rows={listing_count}")
        if limit and parsed_items >= limit:
            break

    affected_rows += flush_listing_rows(rows)
    return listing_count, affected_rows


def main() -> int:
    args = parse_args()
    source = Path(args.source)
    if not source.exists():
        raise RuntimeError(f"Source file does not exist: {source}")
    if args.replace and not args.execute:
        raise RuntimeError("--replace requires --execute")

    with transaction.atomic():
        item_ids, new_items, update_items, parsed_items, skipped_items, planned_listings = collect_iteminfo_changes(
            source,
            limit=args.limit,
            progress_every=args.progress_every,
        )
        if not args.execute:
            transaction.set_rollback(True)
            listing_count = planned_listings
            affected_rows = 0
            created_items = len(new_items)
            updated_items = len(update_items)
        else:
            if new_items:
                Iteminfo.objects.bulk_create(list(new_items.values()), batch_size=args.batch_size)
                refresh_item_ids(list(new_items.keys()), item_ids)
            if update_items:
                Iteminfo.objects.bulk_update(
                    list(update_items.values()),
                    fields=["appid", "name", "market_name_cn"],
                    batch_size=args.batch_size,
                )
            if args.replace:
                deleted, _ = ItemPlatformListing.objects.all().delete()
                print(f"deleted_existing_listings={deleted}")
            listing_count, affected_rows = import_listing_rows(
                source,
                item_ids,
                limit=args.limit,
                progress_every=args.progress_every,
                batch_size=args.batch_size,
            )
            created_items = len(new_items)
            updated_items = len(update_items)

    print(f"source={source}")
    print(f"execute={args.execute}")
    print(f"parsed_items={parsed_items}")
    print(f"skipped_items={skipped_items}")
    print(f"platform_listings={listing_count}")
    print(f"affected_listing_rows={affected_rows}")
    print(f"created_iteminfo={created_items}")
    print(f"updated_iteminfo={updated_items}")
    if not args.execute:
        print("dry_run=true. Add --execute to import data.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
