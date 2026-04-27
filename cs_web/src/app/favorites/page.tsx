"use client";

import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Favorite = {
  id: number;
  iteminfo: {
    id: number;
    market_hash_name: string;
    market_name_cn?: string | null;
  };
  direction_a_platform: string;
  direction_b_platform: string;
  note: string;
  current_opportunity?: {
    profit_cny: string;
    margin_pct: string;
    buy_price_cny: string;
    sell_net_cny: string;
    calculated_at: string;
  } | null;
};

type Paginated<T> = {
  results: T[];
};

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

export default function FavoritesPage() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [message, setMessage] = useState("");
  const token = getToken();

  async function load() {
    if (!token) {
      setMessage("请先登录后查看收藏。");
      return;
    }
    try {
      const payload = await apiFetch<Favorite[] | Paginated<Favorite>>("/api/price/favorites/", { token });
      setItems(Array.isArray(payload) ? payload : payload.results);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "收藏加载失败");
    }
  }

  async function remove(id: number) {
    if (!token) return;
    await apiFetch(`/api/price/favorites/${id}/`, { method: "DELETE", token });
    setItems((current) => current.filter((item) => item.id !== id));
  }

  useEffect(() => {
    load();
  }, []);

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <p>{message || "请先登录。"}</p>
          <Link className="btn-primary mt-4" href="/login">
            登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Favorites</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">机会收藏与跟踪</h1>
        <p className="mt-2 muted-copy">保存关注的饰品和套利方向，回到这里查看当前利润快照。</p>
      </div>

      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="data-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <Star className="h-4 w-4 fill-amber-500" />
                  {item.direction_a_platform} → {item.direction_b_platform}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {item.iteminfo.market_name_cn || item.iteminfo.market_hash_name}
                </h2>
                <div className="mt-1 text-xs text-slate-500">{item.iteminfo.market_hash_name}</div>
              </div>
              <button className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => remove(item.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {item.current_opportunity ? (
              <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
                <Metric label="当前利润" value={money.format(Number(item.current_opportunity.profit_cny))} />
                <Metric label="利润率" value={`${Number(item.current_opportunity.margin_pct).toFixed(2)}%`} />
                <Metric label="更新时间" value={new Date(item.current_opportunity.calculated_at).toLocaleString()} />
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">当前机会表中暂无匹配记录。</div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}
