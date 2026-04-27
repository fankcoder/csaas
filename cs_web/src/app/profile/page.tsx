"use client";

import { BarChart3, ClipboardCheck, PackageSearch, Save, Star, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { apiFetch } from "@/lib/api";
import { getToken, storeAuth, type StoredUser } from "@/lib/auth";

type InventoryAsset = {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
};

type InventoryDescription = {
  classid: string;
  instanceid: string;
  market_hash_name?: string;
  market_name?: string;
  name?: string;
  icon_url?: string;
  tradable?: number;
  marketable?: number;
};

type Inventory = {
  assets?: InventoryAsset[];
  descriptions?: InventoryDescription[];
  total_inventory_count?: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [steamId, setSteamId] = useState("");
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [message, setMessage] = useState("");

  const descriptionMap = useMemo(() => {
    const map = new Map<string, InventoryDescription>();
    for (const item of inventory?.descriptions ?? []) {
      map.set(`${item.classid}_${item.instanceid}`, item);
    }
    return map;
  }, [inventory]);

  async function loadMe(authToken: string | null) {
    if (!authToken) {
      setMessage("请先登录");
      return;
    }
    const data = await apiFetch<StoredUser>("/api/auth/me/", { token: authToken });
    setUser(data);
    setSteamId(data.steam_id || "");
    storeAuth(authToken, data);
  }

  useEffect(() => {
    const authToken = getToken();
    setToken(authToken);
    setCheckedAuth(true);
    loadMe(authToken).catch((err) => setMessage(err instanceof Error ? err.message : "账户加载失败"));
  }, []);

  async function bindSteam() {
    const token = getToken();
    if (!token) return;
    try {
      const data = await apiFetch<StoredUser>("/api/auth/steam/bind/", {
        method: "POST",
        token,
        body: JSON.stringify({ steam_id: steamId })
      });
      setUser(data);
      storeAuth(token, data);
      setMessage("Steam 已绑定");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Steam 绑定失败");
    }
  }

  async function loadInventory() {
    const token = getToken();
    if (!token) return;
    setMessage("");
    try {
      const data = await apiFetch<Inventory>("/api/auth/steam/inventory/", { token });
      setInventory(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "库存加载失败");
    }
  }

  if (checkedAuth && !token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <p className="text-slate-700">请先登录后进入个人中心。</p>
          <Link className="btn-primary mt-4" href="/login">
            登录
          </Link>
        </div>
      </main>
    );
  }

  if (!checkedAuth) {
    return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">加载中</main>;
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Account Center</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">账户与 Steam 库存</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="section-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-slate-700" />
            <div>
              <div className="font-semibold text-slate-950">{user?.username}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            高级权限：{user?.has_premium ? "已开启" : "未开启"}
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">Steam ID</span>
            <input
              className="input-control mt-1 bg-slate-50 focus:bg-white"
              value={steamId}
              onChange={(event) => setSteamId(event.target.value)}
            />
          </label>
          <button
            className="btn-primary mt-3 w-full"
            onClick={bindSteam}
          >
            <Save className="h-4 w-4" />
            保存 Steam
          </button>
          <button
            className="btn-secondary mt-2 w-full"
            onClick={loadInventory}
          >
            <PackageSearch className="h-4 w-4" />
            查询库存
          </button>
          <div className="mt-4 grid gap-2">
            <QuickLink href="/onboarding" icon={<ClipboardCheck className="h-4 w-4" />} label="平台开通清单" />
            <QuickLink href="/favorites" icon={<Star className="h-4 w-4" />} label="机会收藏" />
            <QuickLink href="/reports" icon={<BarChart3 className="h-4 w-4" />} label="收益报表" />
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="font-semibold text-slate-950">库存饰品</div>
            <div className="text-sm text-slate-500">{inventory?.total_inventory_count ?? 0} 件</div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {(inventory?.assets ?? []).slice(0, 60).map((asset) => {
              const desc = descriptionMap.get(`${asset.classid}_${asset.instanceid}`);
              return (
                <div key={asset.assetid} className="rounded-lg border border-slate-200 bg-white p-3 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50/30">
                  {desc?.icon_url ? (
                    <img
                      alt={desc.market_hash_name || desc.name || asset.assetid}
                      className="h-24 w-full object-contain"
                      src={`https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}`}
                    />
                  ) : null}
                  <div className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">
                    {desc?.market_hash_name || desc?.market_name || desc?.name || asset.assetid}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">assetid {asset.assetid}</div>
                </div>
              );
            })}
          </div>
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
