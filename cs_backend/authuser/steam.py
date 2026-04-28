from __future__ import annotations

from datetime import timezone as datetime_timezone
import json
import urllib.error
import urllib.request
from urllib.parse import urlencode

from django.utils import timezone


class SteamInventoryError(RuntimeError):
    pass


class SteamProfileError(RuntimeError):
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


def fetch_player_summary(api_key: str, steam_id: str) -> dict:
    if not api_key:
        return {}
    query = urlencode({"key": api_key, "steamids": steam_id})
    url = f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "csaas/0.1 steam profile client",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise SteamProfileError(f"Steam profile HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise SteamProfileError(f"Steam profile request failed: {exc.reason}") from exc

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SteamProfileError("Steam profile returned invalid JSON") from exc

    players = payload.get("response", {}).get("players", [])
    return players[0] if players else {}


def steam_unix_to_datetime(value):
    if value in (None, ""):
        return None
    try:
        timestamp = int(value)
    except (TypeError, ValueError):
        return None
    return timezone.datetime.fromtimestamp(timestamp, tz=datetime_timezone.utc)


def int_or_none(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def update_profile_from_steam(profile, *, steam_id: str, openid_payload=None, player=None):
    player = player or {}
    openid_payload = openid_payload or {}

    profile.steam_id = steam_id
    profile.steam_openid_claimed_id = str(openid_payload.get("openid.claimed_id", ""))
    profile.steam_openid_identity = str(openid_payload.get("openid.identity", ""))
    profile.steam_openid_raw = dict(openid_payload)
    profile.steam_persona_name = str(player.get("personaname") or profile.steam_persona_name or "")
    profile.steam_profile_url = str(player.get("profileurl") or "")
    profile.steam_avatar = str(player.get("avatar") or "")
    profile.steam_avatar_medium = str(player.get("avatarmedium") or "")
    profile.steam_avatar_full = str(player.get("avatarfull") or "")
    profile.steam_community_visibility_state = int_or_none(player.get("communityvisibilitystate"))
    profile.steam_profile_state = int_or_none(player.get("profilestate"))
    profile.steam_persona_state = int_or_none(player.get("personastate"))
    profile.steam_last_logoff = steam_unix_to_datetime(player.get("lastlogoff"))
    profile.steam_comment_permission = int_or_none(player.get("commentpermission"))
    profile.steam_real_name = str(player.get("realname") or "")
    profile.steam_primary_clan_id = str(player.get("primaryclanid") or "")
    profile.steam_time_created = steam_unix_to_datetime(player.get("timecreated"))
    profile.steam_persona_state_flags = int_or_none(player.get("personastateflags"))
    profile.steam_loc_country_code = str(player.get("loccountrycode") or "")
    profile.steam_loc_state_code = str(player.get("locstatecode") or "")
    profile.steam_loc_city_id = int_or_none(player.get("loccityid"))
    profile.steam_profile_raw = player
    profile.steam_profile_synced_at = timezone.now()
    profile.save()
    return profile


def description_key(classid, instanceid):
    return f"{classid}_{instanceid}"


def description_for_asset(asset, descriptions_by_exact, descriptions_by_class):
    exact = descriptions_by_exact.get(description_key(asset.get("classid"), asset.get("instanceid")))
    if exact:
        return exact
    return descriptions_by_class.get(str(asset.get("classid", "")), {})


def extract_exterior(description):
    for item in description.get("descriptions") or []:
        if item.get("name") == "exterior_wear":
            return str(item.get("value", "")).replace("外观：", "").strip()
    for tag in description.get("tags") or []:
        if tag.get("category") == "Exterior":
            return str(tag.get("localized_tag_name") or "")
    return ""


def extract_inspect_url(description):
    for action in description.get("actions") or []:
        link = action.get("link")
        if link:
            return str(link)
    for action in description.get("market_actions") or []:
        link = action.get("link")
        if link:
            return str(link)
    return ""


def normalize_inventory_payload(payload):
    assets = payload.get("assets") or []
    descriptions = payload.get("descriptions") or []
    properties = {
        str(item.get("assetid")): item
        for item in payload.get("asset_properties") or []
        if item.get("assetid")
    }
    descriptions_by_exact = {
        description_key(item.get("classid"), item.get("instanceid")): item
        for item in descriptions
    }
    descriptions_by_class = {
        str(item.get("classid")): item
        for item in descriptions
        if item.get("classid")
    }

    normalized = []
    for asset in assets:
        description = description_for_asset(asset, descriptions_by_exact, descriptions_by_class)
        amount = asset.get("amount") or 1
        try:
            amount = int(amount)
        except (TypeError, ValueError):
            amount = 1
        normalized.append(
            {
                "asset": asset,
                "description": description,
                "properties": properties.get(str(asset.get("assetid")), {}),
                "appid": str(asset.get("appid") or description.get("appid") or "730"),
                "contextid": str(asset.get("contextid") or "2"),
                "assetid": str(asset.get("assetid") or ""),
                "classid": str(asset.get("classid") or ""),
                "instanceid": str(asset.get("instanceid") or ""),
                "amount": amount,
                "market_hash_name": str(description.get("market_hash_name") or ""),
                "market_name": str(description.get("market_name") or ""),
                "name": str(description.get("name") or ""),
                "name_color": str(description.get("name_color") or ""),
                "type": str(description.get("type") or ""),
                "icon_url": str(description.get("icon_url") or ""),
                "tradable": bool(description.get("tradable")),
                "marketable": bool(description.get("marketable")),
                "commodity": bool(description.get("commodity")),
                "inspect_url": extract_inspect_url(description),
                "exterior": extract_exterior(description),
            }
        )
    return normalized
