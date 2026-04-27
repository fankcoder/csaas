"use client";

import { ArrowLeft, ArrowRight, ExternalLink, LockKeyhole, RefreshCw, Search, Star } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Opportunity = {
  id: number;
  market_hash_name: string;
  market_name_cn?: string | null;
  iteminfo_id: number;
  buy_platform: string;
  buy_group_label: string;
  buy_platform_label: string;
  buy_price_cny: string;
  buy_volume: number;
  buy_quotes: PlatformQuote[];
  sell_platform: string;
  sell_group_label: string;
  sell_platform_label: string;
  sell_net_cny: string;
  sell_volume: number;
  sell_quotes: PlatformQuote[];
  profit_cny: string;
  margin_pct: string;
  favorite_id?: number | null;
  is_favorited?: boolean;
  liquidity_score: number;
  risk_flags: string[];
  calculated_at: string;
};

type PlatformQuote = {
  platform: string;
  label: string;
  price_cny: string;
  net_price_cny: string;
  volume: number;
  last_updated_at?: string | null;
  eligible: boolean;
  is_best_buy?: boolean;
  is_best_sell?: boolean;
  is_selected_sell?: boolean;
  profit_cny?: string | null;
  margin_pct?: string | null;
  market_url?: string | null;
};

type PageData = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Opportunity[];
  source: string;
  min_volume: number;
};

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

const SELL_PLATFORM_OPTIONS = [
  { value: "", label: "Best profit" },
  { value: "buff", label: "BUFF" },
  { value: "youpin", label: "YouPin" },
  { value: "waxpeer", label: "Waxpeer" },
  { value: "shadowpay", label: "ShadowPay" },
  { value: "c5", label: "C5" }
];

export default function ArbitragePage() {
  const [q, setQ] = useState("");
  const [minVolume, setMinVolume] = useState(1);
  const [sellPlatform, setSellPlatform] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(nextPage = page) {
    const token = getToken();
    if (!token) {
      setMessage("Please log in and subscribe before using arbitrage search.");
      return;
    }

    setLoading(true);
    setMessage("");

    const params = new URLSearchParams({
      page: String(nextPage),
      page_size: "30",
      q,
      min_volume: String(minVolume)
    });
    if (sellPlatform) {
      params.set("sell_platform", sellPlatform);
    }

    try {
      const payload = await apiFetch<PageData>(`/api/price/arbitrage/?${params.toString()}`, { token });
      setData(payload);
      setPage(nextPage);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load(1);
  }

  async function toggleFavorite(item: Opportunity) {
    const token = getToken();
    if (!token) return;
    try {
      if (item.favorite_id) {
        await apiFetch(`/api/price/favorites/${item.favorite_id}/`, { method: "DELETE", token });
      } else {
        await apiFetch("/api/price/favorites/", {
          method: "POST",
          token,
          body: JSON.stringify({
            iteminfo_id: item.iteminfo_id,
            direction_a_platform: item.buy_platform,
            direction_b_platform: item.sell_platform
          })
        });
      }
      await load(page);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Favorite update failed.");
    }
  }

  return (
    <main className="app-page">
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Arbitrage Terminal</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">CS2 Skin Profit Search</h1>
          <p className="mt-2 muted-copy">
            Direction A uses the lowest buy price. Direction B can show the best profit or a selected sell platform.
          </p>
        </div>

        <form className="grid gap-2 sm:grid-cols-[260px_120px_160px_auto]" onSubmit={submit}>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input-control pl-9"
              placeholder="Item name"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <input
            className="input-control"
            min={0}
            type="number"
            value={minVolume}
            onChange={(event) => setMinVolume(Number(event.target.value))}
          />
          <select
            className="input-control"
            value={sellPlatform}
            onChange={(event) => setSellPlatform(event.target.value)}
          >
            {SELL_PLATFORM_OPTIONS.map((option) => (
              <option key={option.value || "best"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn-primary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Search
          </button>
        </form>
        </div>
      </div>

      {message ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <LockKeyhole className="h-5 w-5" />
            {message}
          </div>
          <div className="mt-3 flex gap-2">
            <Link className="btn-primary" href="/login">
              Login
            </Link>
            <Link className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold" href="/pricing">
              Pricing
            </Link>
          </div>
        </div>
      ) : null}

      <section className="section-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="font-mono-display text-sm font-semibold text-slate-700">{data?.count ?? 0} opportunities</div>
          <div className="status-pill">Page {page}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] table-fixed divide-y divide-slate-200 text-sm">
            <thead className="table-header">
              <tr>
                <th className="w-[300px] px-4 py-3">Item</th>
                <th className="w-[300px] px-4 py-3">Direction A Buy</th>
                <th className="w-[300px] px-4 py-3">Direction B Sell</th>
                <th className="w-[120px] px-4 py-3">Profit</th>
                <th className="w-[110px] px-4 py-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.results ?? []).map((item) => (
                <tr key={item.id} className="transition-colors duration-200 hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          className="font-semibold text-slate-950 transition-colors duration-200 hover:text-blue-800"
                          href={`/items/${item.iteminfo_id}`}
                        >
                          {item.market_name_cn || item.market_hash_name}
                        </Link>
                        <div className="mt-1 truncate text-xs text-slate-500">{item.market_hash_name}</div>
                      </div>
                      <button
                        className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors duration-200 ${
                          item.is_favorited ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                        onClick={() => toggleFavorite(item)}
                        title={item.is_favorited ? "Remove favorite" : "Save favorite"}
                      >
                        <Star className={`h-4 w-4 ${item.is_favorited ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-950">{item.buy_group_label}</span>
                      <span className="text-xs text-slate-500">{money.format(Number(item.buy_price_cny))}</span>
                    </div>
                    <QuoteList mode="buy" quotes={item.buy_quotes} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-950">{item.sell_platform_label}</span>
                      <span className="text-xs text-slate-500">{money.format(Number(item.sell_net_cny))}</span>
                    </div>
                    <QuoteList mode="sell" quotes={item.sell_quotes} />
                  </td>
                  <td className="px-4 py-3 font-mono-display text-base font-semibold text-blue-800">
                    {money.format(Number(item.profit_cny))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono-display font-medium text-slate-950">{Number(item.margin_pct).toFixed(2)}%</div>
                    <div className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                      LQ {item.liquidity_score}
                    </div>
                    {item.risk_flags.length ? (
                      <div className="mt-1 text-xs text-amber-700">{item.risk_flags.join(", ")}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!loading && (data?.results ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    <div className="font-semibold text-slate-700">No opportunities match the current filters.</div>
                    <div className="mt-1 text-sm">Try lowering the volume threshold or changing the sell platform.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <button
            className="btn-secondary"
            disabled={!data?.previous}
            onClick={() => load(Math.max(1, page - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            className="btn-secondary"
            disabled={!data?.next}
            onClick={() => load(page + 1)}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

function QuoteList({ quotes, mode }: { quotes: PlatformQuote[]; mode: "buy" | "sell" }) {
  return (
    <div className="space-y-2">
      {(quotes ?? []).map((quote) => {
        const active = mode === "buy" ? quote.is_best_buy : quote.is_selected_sell ?? quote.is_best_sell;
        const value = mode === "buy" ? quote.price_cny : quote.net_price_cny;
        const status =
          mode === "buy"
            ? active
              ? "Best buy"
              : quote.eligible
                ? "Eligible"
                : "Low volume"
            : quote.is_selected_sell
              ? "Selected sell"
              : quote.is_best_sell
                ? "Best net"
                : quote.eligible
                  ? "Eligible"
                  : "Low volume";

        return (
          <a
            key={`${quote.platform}-${mode}`}
            className={`group relative block rounded-md border px-3 py-2 transition-colors duration-200 ${
              active
                ? "border-blue-300 bg-blue-50 text-slate-950"
                : quote.eligible
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50 text-slate-400"
            } ${quote.market_url ? "hover:border-blue-300 hover:shadow-sm" : ""}`}
            href={quote.market_url || undefined}
            rel="noreferrer"
            target={quote.market_url ? "_blank" : undefined}
            title={`最后更新时间：${formatUpdatedAt(quote.last_updated_at)}${quote.market_url ? "；点击打开平台页面" : ""}`}
          >
            <div className="pointer-events-none absolute left-3 top-2 z-20 rounded-md bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
              最后更新时间：{formatUpdatedAt(quote.last_updated_at)}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 font-medium">
                <span className="truncate">{quote.label}</span>
                {quote.market_url ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}
              </span>
              <span className="font-semibold">{money.format(Number(value))}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span>Volume {quote.volume}</span>
              <span>{status}</span>
            </div>
            <div className="mt-1 truncate text-xs text-slate-500">Updated {formatUpdatedAt(quote.last_updated_at)}</div>
            {mode === "sell" && quote.profit_cny ? (
              <div className="mt-1 font-mono-display text-xs font-medium text-blue-800">
                Profit {money.format(Number(quote.profit_cny))}
                {quote.margin_pct ? ` / ${Number(quote.margin_pct).toFixed(2)}%` : ""}
              </div>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "暂无更新时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
