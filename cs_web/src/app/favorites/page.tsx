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

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "CNY" });

export default function FavoritesPage() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [message, setMessage] = useState("");
  const token = getToken();

  async function load() {
    if (!token) {
      setMessage("Please log in to view your favorites.");
      return;
    }
    try {
      const payload = await apiFetch<Favorite[] | Paginated<Favorite>>("/api/price/favorites/", { token });
      setItems(Array.isArray(payload) ? payload : payload.results);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load favorites.");
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
          <p>{message || "Please log in first."}</p>
          <Link className="btn-primary mt-4" href="/login">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Favorites</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Saved Opportunities</h1>
        <p className="mt-2 muted-copy">
          Track watched skins and arbitrage routes, then return here for the latest profit snapshot.
        </p>
      </div>

      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="data-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <Star className="h-4 w-4 fill-amber-500" />
                  {item.direction_a_platform} to {item.direction_b_platform}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {item.iteminfo.market_hash_name}
                </h2>
                <div className="mt-1 text-xs text-slate-500">{item.iteminfo.market_hash_name}</div>
              </div>
              <button
                aria-label={`Remove ${item.iteminfo.market_hash_name} from favorites`}
                className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {item.current_opportunity ? (
              <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
                <Metric label="Current profit" value={money.format(Number(item.current_opportunity.profit_cny))} />
                <Metric label="Margin" value={`${Number(item.current_opportunity.margin_pct).toFixed(2)}%`} />
                <Metric label="Updated at" value={new Date(item.current_opportunity.calculated_at).toLocaleString("en-US")} />
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                No matching opportunity is currently available.
              </div>
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
