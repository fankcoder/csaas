"use client";

import { BarChart3, ClipboardCheck, ExternalLink, PackageSearch, RefreshCw, Save, Star, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { apiFetch } from "@/lib/api";
import { getToken, storeAuth, type StoredUser } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type SellPrice = {
  platform: string;
  label: string;
  price_cny: string;
  net_price_cny: string;
  source_price: string;
  source_currency: string;
  volume: number;
  sell_fee: string;
  last_updated_at?: string | null;
  market_url?: string | null;
};

type InventoryItem = {
  id: number;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: number;
  market_hash_name?: string;
  steam_image_url?: string;
  tradable?: boolean;
  marketable?: boolean;
  exterior?: string;
  type?: string;
  best_sell_price?: SellPrice | null;
  sell_prices?: SellPrice[];
  synced_at?: string;
};

type Inventory = {
  count: number;
  next?: string | null;
  previous?: string | null;
  synced?: boolean;
  latest_sync_at?: string | null;
  page_size?: number;
  sync_meta?: {
    total_inventory_count?: number;
    synced_count?: number;
    synced_at?: string;
  };
  results: InventoryItem[];
};

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [steamId, setSteamId] = useState("");
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [message, setMessage] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const { t } = useI18n();

  async function loadMe(authToken: string | null) {
    if (!authToken) {
      setMessage(t("common.loginRequired"));
      return;
    }
    const data = await apiFetch<StoredUser>("/api/auth/me/", { token: authToken });
    setUser(data);
    setSteamId(data.steam_id || "");
    storeAuth(authToken, data);
  }

  async function loadInventoryWithToken(authToken: string, page = inventoryPage) {
    setInventoryLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<Inventory>(`/api/auth/steam/inventory/?page=${page}&page_size=50`, { token: authToken });
      setInventory(data);
      setInventoryPage(page);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("profile.inventoryLoadFailed"));
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    const authToken = getToken();
    setToken(authToken);
    setCheckedAuth(true);
    loadMe(authToken).catch((err) => setMessage(err instanceof Error ? err.message : t("profile.inventoryLoadFailed")));
    if (authToken) {
      loadInventoryWithToken(authToken, 1).catch((err) => setMessage(err instanceof Error ? err.message : t("profile.inventoryLoadFailed")));
    }
  }, []);

  async function bindSteam() {
    const authToken = getToken();
    if (!authToken) return;
    try {
      const data = await apiFetch<StoredUser>("/api/auth/steam/bind/", {
        method: "POST",
        token: authToken,
        body: JSON.stringify({ steam_id: steamId })
      });
      setUser(data);
      storeAuth(authToken, data);
      setMessage(t("profile.steamSaved"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("login.steamFailed"));
    }
  }

  async function loadInventory() {
    const authToken = getToken();
    if (!authToken) return;
    await loadInventoryWithToken(authToken, inventoryPage);
  }

  async function goInventoryPage(page: number) {
    const authToken = getToken();
    if (!authToken || page < 1) return;
    await loadInventoryWithToken(authToken, page);
  }

  async function syncInventory() {
    const authToken = getToken();
    if (!authToken) return;
    setSyncLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<Inventory>("/api/auth/steam/inventory/sync/", {
        method: "POST",
        token: authToken,
        body: JSON.stringify({})
      });
      setInventory(data);
      setInventoryPage(1);
      setMessage(`${t("profile.inventorySynced")}: ${data.sync_meta?.synced_count ?? data.count}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("profile.inventorySyncFailed"));
    } finally {
      setSyncLoading(false);
    }
  }

  if (checkedAuth && !token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <p className="text-slate-700">{t("profile.loginPrompt")}</p>
          <Link className="btn-primary mt-4" href="/login">
            {t("nav.login")}
          </Link>
        </div>
      </main>
    );
  }

  if (!checkedAuth) {
    return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{t("common.loading")}</main>;
  }

  const totalInventoryPages = Math.ceil((inventory?.count ?? 0) / (inventory?.page_size || 50));

  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">{t("profile.eyebrow")}</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{t("profile.title")}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="section-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            {user?.steam_profile?.avatar_full ? (
              <img
                alt={user.steam_persona_name || user.username}
                className="h-12 w-12 rounded-md object-cover"
                src={user.steam_profile.avatar_full}
              />
            ) : (
              <UserCircle className="h-8 w-8 text-slate-700" />
            )}
            <div>
              <div className="font-semibold text-slate-950">{user?.username}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {t("profile.premium")}: {user?.has_premium ? t("profile.enabled") : t("profile.disabled")}
          </div>

          {user?.steam_id ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">{user.steam_persona_name || t("profile.steamUser")}</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{user.steam_id}</div>
              {user.steam_profile?.profile_url ? (
                <a
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  href={user.steam_profile.profile_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("profile.steamProfile")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">Steam ID</span>
            <input
              className="input-control mt-1 bg-slate-50 focus:bg-white"
              value={steamId}
              onChange={(event) => setSteamId(event.target.value)}
            />
          </label>

          <button className="btn-primary mt-3 w-full" onClick={bindSteam}>
            <Save className="h-4 w-4" />
            {t("profile.saveSteam")}
          </button>

          <button className="btn-secondary mt-2 w-full" onClick={syncInventory} disabled={syncLoading}>
            <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
            {syncLoading ? t("profile.syncing") : t("profile.sync")}
          </button>

          <button className="btn-secondary mt-2 w-full" onClick={loadInventory} disabled={inventoryLoading}>
            <PackageSearch className="h-4 w-4" />
            {inventoryLoading ? t("profile.reading") : t("profile.loadSynced")}
          </button>

          {inventory?.latest_sync_at ? (
            <p className="mt-2 text-xs text-slate-500">
              {t("profile.latestSync")}: {new Date(inventory.latest_sync_at).toLocaleString()}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2">
            <QuickLink href="/onboarding" icon={<ClipboardCheck className="h-4 w-4" />} label={t("profile.quickOnboarding")} />
            <QuickLink href="/favorites" icon={<Star className="h-4 w-4" />} label={t("profile.quickFavorites")} />
            <QuickLink href="/reports" icon={<BarChart3 className="h-4 w-4" />} label={t("profile.quickReports")} />
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="font-semibold text-slate-950">{t("profile.inventory")}</div>
            <div className="text-sm text-slate-500">
              {inventory?.count ?? 0} {t("profile.itemsPerPage")}
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {(inventory?.results ?? []).map((asset) => (
              <div key={asset.assetid} className="rounded-lg border border-slate-200 bg-white p-3 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50/30">
                {asset.steam_image_url ? (
                  <img
                    alt={asset.market_hash_name || asset.assetid}
                    className="h-24 w-full object-contain"
                    src={asset.steam_image_url}
                  />
                ) : null}
                <div className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">
                  {asset.market_hash_name || asset.assetid}
                </div>
                <div className="mt-1 text-xs text-slate-500">{asset.exterior || asset.type || `assetid ${asset.assetid}`}</div>
                <div className="mt-3 rounded-md bg-slate-50 p-2">
                  <div className="text-xs text-slate-500">{t("profile.bestNet")}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-950">
                      {asset.best_sell_price ? `¥${asset.best_sell_price.net_price_cny}` : t("profile.noPrice")}
                    </span>
                    <span className="text-xs text-slate-500">{asset.best_sell_price?.label ?? ""}</span>
                  </div>
                </div>
                {asset.sell_prices?.length ? (
                  <div className="mt-2 grid gap-1">
                    {asset.sell_prices.slice(0, 3).map((price) => (
                      <div className="flex items-center justify-between text-xs text-slate-600" key={price.platform}>
                        <span>{price.label}</span>
                        <span className="font-mono">¥{price.net_price_cny}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {inventory && inventory.count === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
                {t("profile.emptyInventory")}
              </div>
            ) : null}
          </div>
          {inventory && inventory.count > 50 ? (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
              <button
                className="btn-secondary h-9"
                disabled={!inventory.previous || inventoryLoading}
                onClick={() => goInventoryPage(inventoryPage - 1)}
              >
                {t("common.previous")}
              </button>
              <div className="text-slate-500">
                {t("common.page")} {inventoryPage} {t("common.of")} {totalInventoryPages}
              </div>
              <button
                className="btn-secondary h-9"
                disabled={!inventory.next || inventoryLoading}
                onClick={() => goInventoryPage(inventoryPage + 1)}
              >
                {t("common.next")}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}
