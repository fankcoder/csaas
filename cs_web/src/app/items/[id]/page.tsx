"use client";

import { ExternalLink, LineChart, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, MetricTile, Notice, PageBody, PageHero, Panel, cx } from "@/components/FVPage";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatCny, formatDateTime } from "@/lib/format";

type ItemInfo = {
  id: number;
  market_hash_name: string;
  market_name_cn?: string | null;
  category?: string | null;
  quality?: string | null;
};

type Quote = {
  platform: string;
  label: string;
  price_cny: string;
  source_price: string;
  source_currency: string;
  volume: number;
  last_updated_at?: string | null;
  market_url?: string | null;
  color: string;
};

type SnapshotPoint = {
  captured_at: string;
  price_cny: string;
  source_price: string;
  source_currency: string;
  volume: number;
  source_updated_at?: string | null;
};

type PriceSeries = {
  platform: string;
  label: string;
  color: string;
  points: SnapshotPoint[];
};

type HistoryResponse = {
  item: ItemInfo;
  days: number;
  sync_interval_minutes: number;
  current_quotes: Quote[];
  series: PriceSeries[];
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  async function load(activeToken = token) {
    if (!activeToken) {
      setMessage("Log in and subscribe to view item price history.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      setData(await apiFetch<HistoryResponse>(`/api/price/iteminfo/${params.id}/history/?days=7`, { token: activeToken }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load price history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedToken = getToken();
    setToken(storedToken);
    setAuthReady(true);
    load(storedToken);
  }, [params.id]);

  if (authReady && !token) {
    return (
      <main className="bg-[#050711] text-white">
        <PageHero
          eyebrow="Item Detail"
          title="Price history is gated"
          description="Item-level platform quotes and snapshot charts are available to authenticated subscribers."
          actions={
            <Link className="btn-primary" href="/login">
              <LockKeyhole className="h-4 w-4" />
              Log in
            </Link>
          }
        />
      </main>
    );
  }

  const itemTitle = data?.item.market_name_cn || data?.item.market_hash_name || "Item detail";

  return (
    <main className="bg-[#050711] text-white">
      <PageHero
        eyebrow="Item Detail"
        title={itemTitle}
        description={data?.item.market_hash_name || "Current quotes and 30-minute snapshot history across connected markets."}
        actions={
          <button className="btn-secondary" onClick={() => load()}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        }
      >
        <Panel className="grid gap-3 p-4">
          <MetricTile label="Platforms" value={data?.current_quotes.length ?? 0} />
          <MetricTile label="History window" value={`${data?.days ?? 7} days`} tone="cyan" />
          <MetricTile label="Planned sync" value={`${data?.sync_interval_minutes ?? 30} min`} tone="slate" />
        </Panel>
      </PageHero>

      <PageBody>
        {message ? <Notice tone="warning">{message}</Notice> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(data?.current_quotes ?? []).map((quote) => (
            <a
              key={quote.platform}
              className="group relative block rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.2)] transition-colors duration-150 hover:border-cyan-300/35"
              href={quote.market_url || undefined}
              rel="noreferrer"
              target={quote.market_url ? "_blank" : undefined}
              title={`Last updated: ${formatDateTime(quote.last_updated_at)}`}
            >
              <div className="pointer-events-none absolute left-4 top-3 z-20 rounded-md bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
                Last updated: {formatDateTime(quote.last_updated_at)}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{quote.label}</div>
                  <div className="mt-1 font-mono-display text-2xl font-semibold" style={{ color: quote.color }}>
                    {formatCny(quote.price_cny)}
                  </div>
                </div>
                {quote.market_url ? <ExternalLink className="h-4 w-4 text-slate-500" /> : null}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {quote.source_currency} {Number(quote.source_price).toFixed(2)} / Volume {quote.volume}
              </div>
              <div className="mt-1 text-xs text-slate-500">Updated {formatDateTime(quote.last_updated_at)}</div>
            </a>
          ))}
        </section>

        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-white">
                <LineChart className="h-5 w-5 text-lime-200" />
                Platform price history
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Each marketplace has its own line, generated from the reserved price snapshot table.
              </p>
            </div>
            <div className="status-pill">Last {data?.days ?? 7} days</div>
          </div>
          <PriceChart series={data?.series ?? []} />
        </Panel>
      </PageBody>
    </main>
  );
}

function PriceChart({ series }: { series: PriceSeries[] }) {
  const width = 920;
  const height = 340;
  const padding = { top: 24, right: 28, bottom: 42, left: 72 };

  const chart = useMemo(() => {
    const points = series.flatMap((item) =>
      item.points.map((point) => ({
        platform: item.platform,
        label: item.label,
        color: item.color,
        x: new Date(point.captured_at).getTime(),
        y: Number(point.price_cny),
        raw: point
      }))
    );
    if (!points.length) return null;
    let minX = Math.min(...points.map((point) => point.x));
    let maxX = Math.max(...points.map((point) => point.x));
    let minY = Math.min(...points.map((point) => point.y));
    let maxY = Math.max(...points.map((point) => point.y));
    if (minX === maxX) {
      minX -= 30 * 60 * 1000;
      maxX += 30 * 60 * 1000;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const x = (value: number) => padding.left + ((value - minX) / (maxX - minX)) * plotW;
    const y = (value: number) => padding.top + (1 - (value - minY) / (maxY - minY)) * plotH;
    return { minX, maxX, minY, maxY, x, y };
  }, [series]);

  if (!chart) {
    return (
      <EmptyState
        title="No snapshot data yet"
        description="After the snapshot capture task runs, this panel will show one price trend line per marketplace."
      />
    );
  }

  const yTicks = Array.from({ length: 4 }, (_, index) => chart.minY + ((chart.maxY - chart.minY) / 3) * index);
  const xTicks = [chart.minX, chart.minX + (chart.maxX - chart.minX) / 2, chart.maxX];

  return (
    <div className="overflow-x-auto">
      <svg className="min-w-[920px]" height={height} role="img" viewBox={`0 0 ${width} ${height}`} width={width}>
        <title>Platform price history</title>
        <rect
          fill="#070a13"
          height={height - padding.top - padding.bottom}
          rx="8"
          stroke="rgba(255,255,255,0.1)"
          width={width - padding.left - padding.right}
          x={padding.left}
          y={padding.top}
        />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line stroke="rgba(255,255,255,0.08)" x1={padding.left} x2={width - padding.right} y1={chart.y(tick)} y2={chart.y(tick)} />
            <text fill="#94A3B8" fontSize="12" textAnchor="end" x={padding.left - 10} y={chart.y(tick) + 4}>
              {formatCny(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text fill="#94A3B8" fontSize="12" key={tick} textAnchor="middle" x={chart.x(tick)} y={height - 14}>
            {new Date(tick).toLocaleDateString()}
          </text>
        ))}
        {series.map((item) => {
          const points = item.points
            .map((point) => ({ x: chart.x(new Date(point.captured_at).getTime()), y: chart.y(Number(point.price_cny)) }))
            .sort((a, b) => a.x - b.x);
          const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
          return (
            <g key={item.platform}>
              {points.length > 1 ? (
                <path d={path} fill="none" stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              ) : null}
              {points.map((point, index) => (
                <circle cx={point.x} cy={point.y} fill="#050711" key={`${item.platform}-${index}`} r="4" stroke={item.color} strokeWidth="3" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-3">
        {series.map((item) => (
          <div className="inline-flex items-center gap-2 text-sm text-slate-400" key={item.platform}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
