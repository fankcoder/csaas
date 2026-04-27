from __future__ import annotations

import json
import urllib.error
import urllib.request


class SteamInventoryError(RuntimeError):
    pass


def fetch_inventory(steam_id: str, appid: str = "730", contextid: str = "2") -> dict:
    url = f"https://steamcommunity.com/inventory/{steam_id}/{appid}/{contextid}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "csaas/0.1 inventory client",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise SteamInventoryError(f"Steam inventory HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise SteamInventoryError(f"Steam inventory request failed: {exc.reason}") from exc

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SteamInventoryError("Steam returned invalid JSON") from exc

    if payload.get("success") not in (1, True):
        raise SteamInventoryError("Steam inventory response was not successful")
    return payload
