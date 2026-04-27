from __future__ import annotations

import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path


COOKIE_FILE = Path(__file__).with_name("cookie.json")

DEFAULT_REQUEST_HEADERS = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Pragma": "no-cache",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
]


def read_cookie_entry(name: str) -> dict | None:
    if not COOKIE_FILE.exists():
        print(f"cookie file not found: {COOKIE_FILE}")
        return None
    try:
        data = json.loads(COOKIE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"invalid cookie json: {exc}")
        return None

    entry = data.get(name)
    if not entry:
        return None

    expires_at = entry.get("expire")
    if expires_at:
        normalized = str(expires_at).replace("Z", "+00:00")
        try:
            expires = datetime.fromisoformat(normalized)
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
        except ValueError:
            print(f"invalid {name} cookie expire: {expires_at}")
            return None
        if expires < datetime.now(timezone.utc):
            print(f"{name} cookie expired")
            return None

    return entry


def bearer(value: str | None) -> str | None:
    if not value:
        return None
    return value if value.lower().startswith("bearer ") else f"Bearer {value}"


def generate_traceparent() -> str:
    traceid = "".join(random.choices("0123456789abcdef", k=32))
    spanid = "".join(random.choices("0123456789abcdef", k=16))
    return f"00-{traceid}-{spanid}-01"


def get_buff_header() -> dict | None:
    entry = read_cookie_entry("buff")
    cookie = entry.get("cookie") if entry else os.getenv("BUFF_COOKIE")
    if not cookie:
        print("missing BUFF cookie")
        return None

    headers = dict(DEFAULT_REQUEST_HEADERS)
    headers.update(
        {
            "Referer": "https://buff.163.com/market/csgo",
            "User-Agent": random.choice(USER_AGENTS),
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": cookie,
        }
    )
    return headers


def get_uu_header() -> dict | None:
    entry = read_cookie_entry("uu")
    token = entry.get("cookie") if entry else os.getenv("YOUPIN_TOKEN") or os.getenv("UU_TOKEN")
    token = bearer(token)
    if not token:
        print("missing YouPin authorization token")
        return None

    device_token = os.getenv("YOUPIN_DEVICE_TOKEN", "Zt/RvRTPvpIDANJ+y2NUZqX8")
    request_tag = os.getenv("YOUPIN_REQUEST_TAG", "4E101ECC0AFD39768BF003274B1D9D75")
    return {
        "Host": "api.youpin898.com",
        "api-version": "1.0",
        "tracestate": "bnro=android/10_android/8.12.1_okhttp/3.14.9",
        "traceparent": generate_traceparent(),
        "devicetoken": device_token,
        "deviceid": device_token,
        "requesttag": request_tag,
        "devicetype": "1",
        "platform": "android",
        "currenttheme": "Light",
        "package-type": "uuyp",
        "app-version": os.getenv("YOUPIN_APP_VERSION", "5.21.2"),
        "uk": os.getenv("YOUPIN_UK", ""),
        "device-info": json.dumps(
            {
                "deviceId": device_token,
                "deviceType": os.getenv("YOUPIN_DEVICE_TYPE", "MIX2S"),
                "hasSteamApp": 1,
                "requestTag": request_tag,
                "systemName": "Android",
                "systemVersion": "10",
            },
            ensure_ascii=False,
        ),
        "apptype": "4",
        "authorization": token,
        "content-type": "application/json; charset=utf-8",
        "user-agent": "okhttp/3.14.9",
    }


def get_shadow_header() -> dict | None:
    entry = read_cookie_entry("shadow") or read_cookie_entry("shadowpay")
    token = entry.get("cookie") if entry else os.getenv("SHADOWPAY_TOKEN")
    token = bearer(token)
    if not token:
        print("missing ShadowPay bearer token")
        return None
    return {"Authorization": token}
