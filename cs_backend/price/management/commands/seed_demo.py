from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from price.models import Iteminfo, Price


class Command(BaseCommand):
    help = "Create demo iteminfo/price tables and seed arbitrage examples."

    def handle(self, *args, **options):
        self.create_unmanaged_tables()
        Price.objects.all().delete()
        Iteminfo.objects.all().delete()

        now = timezone.now()
        rows = [
            {
                "item": {
                    "appid": "730",
                    "name": "AK-47 | Redline (Field-Tested)",
                    "market_hash_name": "AK-47 | Redline (Field-Tested)",
                    "market_name_cn": "AK-47 | 红线（久经沙场）",
                    "quality": "Classified",
                    "quality_color": "d32ce6",
                    "category": "Rifle",
                },
                "price": {
                    "buff_sell_price": Decimal("118.50"),
                    "buff_sell_num": 340,
                    "wax_price": Decimal("18890.00"),
                    "wax_count": 42,
                    "shadow_price": Decimal("17.20"),
                    "shadow_sell_num": 28,
                },
            },
            {
                "item": {
                    "appid": "730",
                    "name": "AWP | Asiimov (Field-Tested)",
                    "market_hash_name": "AWP | Asiimov (Field-Tested)",
                    "market_name_cn": "AWP | 二西莫夫（久经沙场）",
                    "quality": "Covert",
                    "quality_color": "eb4b4b",
                    "category": "Sniper Rifle",
                },
                "price": {
                    "buff_sell_price": Decimal("610.00"),
                    "buff_sell_num": 85,
                    "wax_price": Decimal("96000.00"),
                    "wax_count": 16,
                    "shadow_price": Decimal("89.40"),
                    "shadow_sell_num": 12,
                },
            },
            {
                "item": {
                    "appid": "730",
                    "name": "Karambit | Fade (Factory New)",
                    "market_hash_name": "Karambit | Fade (Factory New)",
                    "market_name_cn": "爪子刀 | 渐变之色（崭新出厂）",
                    "quality": "Covert",
                    "quality_color": "eb4b4b",
                    "category": "Knife",
                },
                "price": {
                    "buff_sell_price": Decimal("11900.00"),
                    "buff_sell_num": 12,
                    "wax_price": Decimal("1850000.00"),
                    "wax_count": 4,
                    "shadow_price": Decimal("1710.00"),
                    "shadow_sell_num": 3,
                },
            },
            {
                "item": {
                    "appid": "730",
                    "name": "USP-S | Kill Confirmed (Minimal Wear)",
                    "market_hash_name": "USP-S | Kill Confirmed (Minimal Wear)",
                    "market_name_cn": "USP 消音版 | 枪响人亡（略有磨损）",
                    "quality": "Covert",
                    "quality_color": "eb4b4b",
                    "category": "Pistol",
                },
                "price": {
                    "buff_sell_price": Decimal("455.00"),
                    "buff_sell_num": 50,
                    "wax_price": Decimal("73900.00"),
                    "wax_count": 8,
                    "shadow_price": Decimal("69.00"),
                    "shadow_sell_num": 6,
                },
            },
            {
                "item": {
                    "appid": "730",
                    "name": "M4A1-S | Printstream (Minimal Wear)",
                    "market_hash_name": "M4A1-S | Printstream (Minimal Wear)",
                    "market_name_cn": "M4A1 消音型 | 印花集（略有磨损）",
                    "quality": "Covert",
                    "quality_color": "eb4b4b",
                    "category": "Rifle",
                },
                "price": {
                    "buff_sell_price": Decimal("1480.00"),
                    "buff_sell_num": 0,
                    "wax_price": Decimal("236000.00"),
                    "wax_count": 10,
                    "shadow_price": Decimal("222.00"),
                    "shadow_sell_num": 0,
                },
            },
        ]

        for index, row in enumerate(rows, start=1):
            item = Iteminfo.objects.create(**row["item"])
            Price.objects.create(
                iteminfo=item,
                buff_id=10_000 + index,
                buff_time=now,
                wax_time=now,
                shadow_time=now.date(),
                **row["price"],
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(rows)} demo prices."))

    def create_unmanaged_tables(self):
        vendor = connection.vendor
        id_type = "BIGINT PRIMARY KEY AUTO_INCREMENT" if vendor == "mysql" else "INTEGER PRIMARY KEY AUTOINCREMENT"
        bool_type = "BOOLEAN" if vendor == "mysql" else "INTEGER"
        datetime_type = "DATETIME"

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS iteminfo (
                    id {id_type},
                    appid VARCHAR(8) NULL,
                    name VARCHAR(128) NULL,
                    market_hash_name VARCHAR(128) NOT NULL,
                    market_name_cn VARCHAR(128) NULL,
                    icon_url VARCHAR(512) NULL,
                    quality VARCHAR(64) NULL,
                    quality_color VARCHAR(32) NULL,
                    collection VARCHAR(64) NULL,
                    collection_url VARCHAR(512) NULL,
                    category VARCHAR(50) NULL
                )
                """
            )
            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS price (
                    id {id_type},
                    iteminfo_id BIGINT NULL UNIQUE,
                    buff_id INTEGER NULL,
                    buff_buy_price DECIMAL(8, 2) NULL,
                    buff_buy_num INTEGER NULL,
                    buff_sell_price DECIMAL(8, 2) NULL,
                    buff_sell_num INTEGER NULL,
                    buff_time {datetime_type} NULL,
                    steam_price DECIMAL(8, 2) NULL,
                    steam_price_cny DECIMAL(8, 2) NULL,
                    steam_time {datetime_type} NULL,
                    wax_price DECIMAL(15, 2) NULL,
                    wax_time {datetime_type} NULL,
                    wax_count INTEGER NULL,
                    shadow_price DECIMAL(8, 2) NULL,
                    shadow_time DATE NULL,
                    shadow_sell_num INTEGER NULL,
                    stock INTEGER NULL DEFAULT 0,
                    star {bool_type} NULL,
                    cent DOUBLE NOT NULL DEFAULT 0,
                    profit DECIMAL(8, 2) NULL,
                    card_price DECIMAL(8, 2) NULL,
                    wax_avg_sells INTEGER NULL DEFAULT 0,
                    c5_price DECIMAL(8, 2) NULL,
                    ig_price DECIMAL(8, 2) NULL,
                    uu_price DECIMAL(8, 2) NULL
                )
                """
            )
