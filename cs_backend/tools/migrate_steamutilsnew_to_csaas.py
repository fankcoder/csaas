"""
Migrate iteminfo and price data from steamutilsnew to csaas.

Default mode is dry-run. Add --execute to write data.

Examples:
    python tools/migrate_steamutilsnew_to_csaas.py
    python tools/migrate_steamutilsnew_to_csaas.py --execute
    python tools/migrate_steamutilsnew_to_csaas.py --execute --replace
"""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

try:
    import MySQLdb
except ImportError:  # pragma: no cover
    MySQLdb = None


BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"
IDENTIFIER_RE = re.compile(r"^[A-Za-z0-9_]+$")
TABLES = ("iteminfo", "price")


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        os.environ.setdefault(key, value)


def parse_database_url(url: str) -> dict[str, str]:
    if not url:
        return {}
    parsed = urlparse(url)
    if not parsed.scheme.startswith("mysql"):
        return {}
    return {
        "host": parsed.hostname or "",
        "port": str(parsed.port or 3306),
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "database": parsed.path.lstrip("/"),
    }


def mysql_config(args: argparse.Namespace) -> dict[str, object]:
    load_env_file(ENV_FILE)
    url_config = parse_database_url(os.getenv("DATABASE_URL", ""))

    return {
        "host": args.host or os.getenv("MYSQL_HOST") or url_config.get("host") or "127.0.0.1",
        "port": int(args.port or os.getenv("MYSQL_PORT") or url_config.get("port") or 3306),
        "user": args.user or os.getenv("MYSQL_USER") or url_config.get("user") or "root",
        "passwd": args.password
        if args.password is not None
        else os.getenv("MYSQL_PASSWORD", url_config.get("password", "")),
        "charset": "utf8mb4",
        "use_unicode": True,
    }


def target_database(args: argparse.Namespace) -> str:
    url_config = parse_database_url(os.getenv("DATABASE_URL", ""))
    return args.target_db or os.getenv("MYSQL_DATABASE") or url_config.get("database") or "csaas"


def quote_identifier(name: str) -> str:
    if not IDENTIFIER_RE.match(name):
        raise ValueError(f"Unsafe MySQL identifier: {name!r}")
    return f"`{name}`"


def qname(database: str, table: str) -> str:
    return f"{quote_identifier(database)}.{quote_identifier(table)}"


def table_exists(cursor, database: str, table: str) -> bool:
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = %s AND table_name = %s
        """,
        (database, table),
    )
    return cursor.fetchone()[0] > 0


def table_columns(cursor, database: str, table: str) -> list[str]:
    cursor.execute(f"SHOW COLUMNS FROM {qname(database, table)}")
    return [row[0] for row in cursor.fetchall()]


def table_count(cursor, database: str, table: str) -> int:
    cursor.execute(f"SELECT COUNT(*) FROM {qname(database, table)}")
    return int(cursor.fetchone()[0])


def validate_databases(cursor, source_db: str, target_db: str) -> None:
    if source_db == target_db:
        raise RuntimeError("source-db and target-db cannot be the same database.")
    for database in (source_db, target_db):
        cursor.execute(
            "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = %s",
            (database,),
        )
        if cursor.fetchone()[0] == 0:
            raise RuntimeError(f"MySQL database does not exist: {database}")

    for table in TABLES:
        if not table_exists(cursor, source_db, table):
            raise RuntimeError(f"Source table does not exist: {source_db}.{table}")
        if not table_exists(cursor, target_db, table):
            raise RuntimeError(f"Target table does not exist: {target_db}.{table}. Run Django migrations first.")


def common_columns(cursor, source_db: str, target_db: str, table: str) -> list[str]:
    source_columns = set(table_columns(cursor, source_db, table))
    target_columns = table_columns(cursor, target_db, table)
    columns = [column for column in target_columns if column in source_columns]
    if "id" not in columns:
        raise RuntimeError(f"{table} must have an id column in both source and target tables.")
    return columns


def delete_target_rows(cursor, target_db: str) -> None:
    cursor.execute(f"DELETE FROM {qname(target_db, 'price')}")
    cursor.execute(f"DELETE FROM {qname(target_db, 'iteminfo')}")


def copy_table(cursor, source_db: str, target_db: str, table: str) -> int:
    columns = common_columns(cursor, source_db, target_db, table)
    column_sql = ", ".join(quote_identifier(column) for column in columns)
    update_columns = [column for column in columns if column != "id"]
    update_sql = ", ".join(
        f"{quote_identifier(column)} = VALUES({quote_identifier(column)})"
        for column in update_columns
    )

    sql = f"""
        INSERT INTO {qname(target_db, table)} ({column_sql})
        SELECT {column_sql}
        FROM {qname(source_db, table)}
        ON DUPLICATE KEY UPDATE {update_sql}
    """
    cursor.execute(sql)
    return cursor.rowcount


def print_plan(cursor, source_db: str, target_db: str) -> None:
    print(f"source_db={source_db}")
    print(f"target_db={target_db}")
    for table in TABLES:
        columns = common_columns(cursor, source_db, target_db, table)
        source_count = table_count(cursor, source_db, table)
        target_count = table_count(cursor, target_db, table)
        print(
            f"{table}: source_rows={source_count}, target_rows={target_count}, "
            f"common_columns={len(columns)}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate steamutilsnew.iteminfo/price into csaas.")
    parser.add_argument("--source-db", default="steamutilsnew", help="Source MySQL database.")
    parser.add_argument("--target-db", default=None, help="Target MySQL database. Defaults to .env target.")
    parser.add_argument("--host", default=None, help="MySQL host override.")
    parser.add_argument("--port", default=None, help="MySQL port override.")
    parser.add_argument("--user", default=None, help="MySQL user override.")
    parser.add_argument("--password", default=None, help="MySQL password override.")
    parser.add_argument("--execute", action="store_true", help="Write data. Without this flag, only prints a dry-run plan.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete target price/iteminfo rows before copying. Requires --execute.",
    )
    args = parser.parse_args()

    if MySQLdb is None:
        raise RuntimeError("mysqlclient is not installed. Install requirements.txt first.")

    target_db = target_database(args)
    config = mysql_config(args)

    connection = MySQLdb.connect(**config)
    try:
        cursor = connection.cursor()
        validate_databases(cursor, args.source_db, target_db)
        print_plan(cursor, args.source_db, target_db)

        if not args.execute:
            print("dry_run=true. Add --execute to migrate data.")
            return 0

        if args.replace:
            print("replace=true. Deleting target rows from price and iteminfo.")
            delete_target_rows(cursor, target_db)

        for table in TABLES:
            affected = copy_table(cursor, args.source_db, target_db, table)
            print(f"copied {table}: affected_rows={affected}")

        connection.commit()

        for table in TABLES:
            print(f"{table}: target_rows_after={table_count(cursor, target_db, table)}")
        return 0
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())
