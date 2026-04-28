"use client";

import { ArrowLeft, ArrowRight, ExternalLink, LockKeyhole, Plus, RefreshCw, Search, ShoppingCart, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { EmptyState, MetricTile, Notice, PageBody, PageHero, Panel, cx } from "@/components/FVPage";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatCny, formatDateTime, formatPercent } from "@/lib/format";

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

type PageData = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Opportunity[];
  source: string;
  min_volume: number;
};

type CartLine = {
  id: string;
  itemName: string;
  marketHashName: string;
  buyQuotes: PlatformQuote[];
  sellQuotes: PlatformQuote[];
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
};

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
  const [cart, setCart] = useState<CartLine[]>([]);

  async function load(nextPage = page) {
    const token = getToken();
    if (!token) {
      setMessage("Log in and subscribe before using the full arbitrage terminal.");
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
      setMessage(err instanceof Error ? err.message : "Failed to load arbitrage data.");
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

  function quoteNumber(value: string | number | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function addToCart(item: Opportunity) {
    const buyQuote =
      item.buy_quotes.find((quote) => quote.is_best_buy) ??
      item.buy_quotes.find((quote) => quote.platform === item.buy_platform) ??
      item.buy_quotes[0];
    const sellQuote =
      item.sell_quotes.find((quote) => quote.is_selected_sell) ??
      item.sell_quotes.find((quote) => quote.is_best_sell) ??
      item.sell_quotes.find((quote) => quote.platform === item.sell_platform) ??
      item.sell_quotes[0];

    setCart((current) => [
      {
        id: `${item.id}-${Date.now()}`,
        itemName: item.market_hash_name,
        marketHashName: item.market_hash_name,
        buyQuotes: item.buy_quotes,
        sellQuotes: item.sell_quotes,
        buyPlatform: buyQuote?.platform ?? item.buy_platform,
        sellPlatform: sellQuote?.platform ?? item.sell_platform,
        buyPrice: quoteNumber(buyQuote?.price_cny ?? item.buy_price_cny),
        sellPrice: quoteNumber(sellQuote?.net_price_cny ?? item.sell_net_cny),
        quantity: 1
      },
      ...current
    ]);
  }

  function updateCartLine(id: string, patch: Partial<CartLine>) {
    setCart((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function changeCartPlatform(id: string, mode: "buy" | "sell", platform: string) {
    setCart((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const quote = (mode === "buy" ? line.buyQuotes : line.sellQuotes).find((entry) => entry.platform === platform);
        if (!quote) return line;
        return mode === "buy"
          ? { ...line, buyPlatform: platform, buyPrice: quoteNumber(quote.price_cny) }
          : { ...line, sellPlatform: platform, sellPrice: quoteNumber(quote.net_price_cny) };
      })
    );
  }

  const cartSummary = useMemo(() => {
    const buyCost = cart.reduce((sum, line) => sum + line.buyPrice * line.quantity, 0);
    const sellRevenue = cart.reduce((sum, line) => sum + line.sellPrice * line.quantity, 0);
    const profit = sellRevenue - buyCost;
    const margin = buyCost > 0 ? (profit / buyCost) * 100 : 0;
    return { buyCost, sellRevenue, profit, margin };
  }, [cart]);

  const latestCalculation = data?.results?.[0]?.calculated_at;

  return (
    <main className="bg-[#050711] text-white">
      <PageHero
        eyebrow="Arbitrage Terminal"
        title="Cross-market deal table"
        description="Direction A uses the lowest eligible buy price. Direction B can show the best exit route or the exact sell platform you select."
      >
        <Panel className="grid gap-3 p-4">
          <MetricTile label="Opportunities" value={data?.count ?? 0} detail={`Page ${page}`} />
          <MetricTile label="Volume floor" value={data?.min_volume ?? minVolume} tone="cyan" detail="Applied to platform liquidity" />
          <MetricTile label="Last calculation" value={latestCalculation ? formatDateTime(latestCalculation) : "Waiting"} tone="slate" />
        </Panel>
      </PageHero>

      <PageBody>
        <Panel className="p-4">
          <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_190px_auto]" onSubmit={submit}>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input-control pl-9"
                placeholder="Search item name"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </label>
            <input
              aria-label="Minimum volume"
              className="input-control"
              min={0}
              type="number"
              value={minVolume}
              onChange={(event) => setMinVolume(Number(event.target.value))}
            />
            <select
              aria-label="Sell platform"
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
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Search
            </button>
          </form>
        </Panel>

        {message ? (
          <Notice
            title="Access required"
            tone="warning"
            actions={
              <>
                <Link className="btn-primary" href="/login">
                  <LockKeyhole className="h-4 w-4" />
                  Log in
                </Link>
                <Link className="btn-secondary" href="/pricing">
                  View pricing
                </Link>
              </>
            }
          >
            {message}
          </Notice>
        ) : null}

        <CartPanel
          cart={cart}
          summary={cartSummary}
          onChangePlatform={changeCartPlatform}
          onRemove={(id) => setCart((current) => current.filter((line) => line.id !== id))}
          onUpdate={updateCartLine}
        />

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="font-mono-display text-sm font-semibold text-slate-200">{data?.count ?? 0} opportunities</div>
            <div className="status-pill">Page {page}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-fixed divide-y divide-white/10 text-sm">
              <thead className="table-header">
                <tr>
                  <th className="w-[300px] px-4 py-3">Item</th>
                  <th className="w-[300px] px-4 py-3">Direction A Buy</th>
                  <th className="w-[300px] px-4 py-3">Direction B Sell</th>
                  <th className="w-[120px] px-4 py-3 text-right">Profit</th>
                  <th className="w-[110px] px-4 py-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(data?.results ?? []).map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-white/[0.04]">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            className="font-semibold text-white transition-colors duration-150 hover:text-lime-200"
                            href={`/items/${item.iteminfo_id}`}
                          >
                            {item.market_hash_name}
                          </Link>
                          <div className="mt-1 truncate text-xs text-slate-500">{item.market_hash_name}</div>
                          <div className="mt-2 text-xs text-slate-500">Calculated {formatDateTime(item.calculated_at)}</div>
                        </div>
                        <button
                          className={cx(
                            "rounded-md border p-2 transition-colors duration-150",
                            item.is_favorited
                              ? "border-lime-300/35 bg-lime-300/10 text-lime-200"
                              : "border-white/10 text-slate-500 hover:border-lime-300/35 hover:text-lime-200"
                          )}
                          onClick={() => toggleFavorite(item)}
                          title={item.is_favorited ? "Remove favorite" : "Save favorite"}
                        >
                          <Star className={cx("h-4 w-4", item.is_favorited && "fill-lime-200")} />
                        </button>
                        <button
                          className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-100 transition-colors duration-150 hover:border-cyan-200/45 hover:bg-cyan-300/15"
                          onClick={() => addToCart(item)}
                          title="Add to profit cart"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-100">{item.buy_group_label}</span>
                        <span className="font-mono-display text-xs text-lime-200">{formatCny(item.buy_price_cny)}</span>
                      </div>
                      <QuoteList mode="buy" quotes={item.buy_quotes} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-100">{item.sell_platform_label}</span>
                        <span className="font-mono-display text-xs text-cyan-200">{formatCny(item.sell_net_cny)}</span>
                      </div>
                      <QuoteList mode="sell" quotes={item.sell_quotes} />
                    </td>
                    <td className="px-4 py-3 text-right align-top font-mono-display text-base font-semibold text-lime-200">
                      {formatCny(item.profit_cny)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="font-mono-display font-medium text-white">{formatPercent(item.margin_pct)}</div>
                      <div className="mt-1 inline-flex rounded-md bg-lime-300/10 px-2 py-1 text-xs font-semibold text-lime-200">
                        LQ {item.liquidity_score}
                      </div>
                      {item.risk_flags.length ? (
                        <div className="mt-1 text-xs text-rose-200">{item.risk_flags.join(", ")}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!loading && (data?.results ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No opportunities match the current filters"
                        description="Try lowering the volume threshold, clearing the item search, or switching Direction B back to best profit."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <button className="btn-secondary" disabled={!data?.previous} onClick={() => load(Math.max(1, page - 1))}>
              <ArrowLeft className="h-4 w-4" />
              Prev
            </button>
            <button className="btn-secondary" disabled={!data?.next} onClick={() => load(page + 1)}>
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Panel>
      </PageBody>
    </main>
  );
}

function CartPanel({
  cart,
  summary,
  onChangePlatform,
  onRemove,
  onUpdate
}: {
  cart: CartLine[];
  summary: { buyCost: number; sellRevenue: number; profit: number; margin: number };
  onChangePlatform: (id: string, mode: "buy" | "sell", platform: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CartLine>) => void;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-cyan-300/10 p-2 text-cyan-200">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono-display text-sm font-semibold text-slate-100">Estimated return cart</div>
            <div className="text-xs text-slate-500">Switch platforms or quantities to recalculate locally.</div>
          </div>
        </div>
        <div className="grid gap-2 text-right sm:grid-cols-4 sm:text-left">
          <CartMetric label="Buy cost" value={formatCny(summary.buyCost)} />
          <CartMetric label="Sell revenue" value={formatCny(summary.sellRevenue)} />
          <CartMetric label="Est. profit" value={formatCny(summary.profit)} tone={summary.profit >= 0 ? "good" : "bad"} />
          <CartMetric label="Margin" value={`${summary.margin.toFixed(2)}%`} />
        </div>
      </div>

      {cart.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] table-fixed divide-y divide-white/10 text-sm">
            <thead className="table-header">
              <tr>
                <th className="w-[300px] px-4 py-3">Item</th>
                <th className="w-[220px] px-4 py-3">Buy platform</th>
                <th className="w-[150px] px-4 py-3 text-right">Buy price</th>
                <th className="w-[220px] px-4 py-3">Sell platform</th>
                <th className="w-[150px] px-4 py-3 text-right">Sell price</th>
                <th className="w-[120px] px-4 py-3 text-right">Qty</th>
                <th className="w-[150px] px-4 py-3 text-right">Est. profit</th>
                <th className="w-[80px] px-4 py-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {cart.map((line) => {
                const profit = (line.sellPrice - line.buyPrice) * line.quantity;
                return (
                  <tr key={line.id} className="hover:bg-white/[0.035]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{line.itemName}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{line.marketHashName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`${line.itemName} buy platform`}
                        className="input-control"
                        value={line.buyPlatform}
                        onChange={(event) => onChangePlatform(line.id, "buy", event.target.value)}
                      >
                        {line.buyQuotes.map((quote) => (
                          <option key={`${line.id}-buy-${quote.platform}`} value={quote.platform}>
                            {quote.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-display text-lime-200">{formatCny(line.buyPrice)}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`${line.itemName} sell platform`}
                        className="input-control"
                        value={line.sellPlatform}
                        onChange={(event) => onChangePlatform(line.id, "sell", event.target.value)}
                      >
                        {line.sellQuotes.map((quote) => (
                          <option key={`${line.id}-sell-${quote.platform}`} value={quote.platform}>
                            {quote.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-display text-cyan-200">{formatCny(line.sellPrice)}</td>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`${line.itemName} quantity`}
                        className="input-control text-right"
                        min={1}
                        step={1}
                        type="number"
                        value={line.quantity}
                        onChange={(event) => onUpdate(line.id, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                      />
                    </td>
                    <td className={cx("px-4 py-3 text-right font-mono-display font-semibold", profit >= 0 ? "text-lime-200" : "text-rose-200")}>
                      {formatCny(profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-400 transition-colors duration-150 hover:border-rose-300/35 hover:bg-rose-300/10 hover:text-rose-200"
                        onClick={() => onRemove(line.id)}
                        title="Remove from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          Add deals from the table to model a basket-level estimated return.
        </div>
      )}
    </Panel>
  );
}

function CartMetric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cx("font-mono-display text-sm font-semibold", tone === "good" ? "text-lime-200" : tone === "bad" ? "text-rose-200" : "text-white")}>
        {value}
      </div>
    </div>
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
            className={cx(
              "group relative block rounded-md border px-3 py-2 transition-colors duration-150",
              active
                ? "border-lime-300/35 bg-lime-300/10 text-white"
                : quote.eligible
                  ? "border-white/10 bg-white/[0.03] text-slate-300"
                  : "border-white/10 bg-white/[0.02] text-slate-500",
              quote.market_url && "hover:border-cyan-300/35"
            )}
            href={quote.market_url || undefined}
            rel="noreferrer"
            target={quote.market_url ? "_blank" : undefined}
            title={`Last updated: ${formatDateTime(quote.last_updated_at)}${quote.market_url ? "; open market page" : ""}`}
          >
            <div className="pointer-events-none absolute left-3 top-2 z-20 rounded-md bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
              Last updated: {formatDateTime(quote.last_updated_at)}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 font-medium">
                <span className="truncate">{quote.label}</span>
                {quote.market_url ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" /> : null}
              </span>
              <span className="font-mono-display font-semibold">{formatCny(value)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Volume {quote.volume}</span>
              <span>{status}</span>
            </div>
            {mode === "sell" && quote.profit_cny ? (
              <div className="mt-1 font-mono-display text-xs font-medium text-lime-200">
                Profit {formatCny(quote.profit_cny)}
                {quote.margin_pct ? ` / ${formatPercent(quote.margin_pct)}` : ""}
              </div>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
