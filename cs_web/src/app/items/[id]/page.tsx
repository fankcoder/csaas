"use client";

import { ExternalLink, LineChart, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

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

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  async function load(activeToken = token) {
    if (!activeToken) {
      setMessage("请先登录并订阅后查看饰品价格走势。");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      setData(await apiFetch<HistoryResponse>(`/api/price/iteminfo/${params.id}/history/?days=7`, { token: activeToken }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "价格走势加载失败");
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
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <div className="flex items-center gap-2 font-semibold text-slate-950">
            <LockKeyhole className="h-5 w-5" />
            {message || "请先登录。"}
          </div>
          <Link className="btn-primary mt-4" href="/login">
            登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Item Detail</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {data?.item.market_name_cn || data?.item.market_hash_name || "饰品详情"}
          </h1>
          {data?.item.market_hash_name ? <p className="mt-2 muted-copy">{data.item.market_hash_name}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {data?.item.category ? <span className="status-pill">{data.item.category}</span> : null}
            {data?.item.quality ? <span className="status-pill">{data.item.quality}</span> : null}
            <span className="status-pill">预计每 {data?.sync_interval_minutes ?? 30} 分钟同步</span>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => load()}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {message ? <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.current_quotes ?? []).map((quote) => (
          <a
            key={quote.platform}
            className="group relative block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-150 hover:border-blue-300"
            href={quote.market_url || undefined}
            rel="noreferrer"
            target={quote.market_url ? "_blank" : undefined}
            title={`最后更新时间：${formatDate(quote.last_updated_at)}`}
          >
            <div className="pointer-events-none absolute left-4 top-3 z-20 rounded-md bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
              最后更新时间：{formatDate(quote.last_updated_at)}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">{quote.label}</div>
                <div className="mt-1 font-mono-display text-2xl font-semibold" style={{ color: quote.color }}>
                  {money.format(Number(quote.price_cny))}
                </div>
              </div>
              {quote.market_url ? <ExternalLink className="h-4 w-4 text-slate-400" /> : null}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {quote.source_currency} {Number(quote.source_price).toFixed(2)} / Volume {quote.volume}
            </div>
            <div className="mt-1 text-xs text-slate-500">Updated {formatDate(quote.last_updated_at)}</div>
          </a>
        ))}
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-950">
              <LineChart className="h-5 w-5 text-blue-800" />
              平台价格走势
            </div>
            <p className="mt-1 text-sm text-slate-500">
              每个平台一条价格线，基于 price_snapshot 快照表生成。
            </p>
          </div>
          <div className="status-pill">最近 {data?.days ?? 7} 天</div>
        </div>
        <PriceChart series={data?.series ?? []} />
      </section>
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
    return { points, minX, maxX, minY, maxY, x, y };
  }, [series]);

  if (!chart) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        暂无快照数据。运行 python tools/capture_price_snapshots.py --execute 后，这里会显示走势线。
      </div>
    );
  }

  const yTicks = Array.from({ length: 4 }, (_, index) => chart.minY + ((chart.maxY - chart.minY) / 3) * index);
  const xTicks = [chart.minX, chart.minX + (chart.maxX - chart.minX) / 2, chart.maxX];

  return (
    <div className="overflow-x-auto">
      <svg className="min-w-[920px]" height={height} role="img" viewBox={`0 0 ${width} ${height}`} width={width}>
        <title>不同平台价格走势图</title>
        <rect
          fill="#F8FAFC"
          height={height - padding.top - padding.bottom}
          rx="8"
          width={width - padding.left - padding.right}
          x={padding.left}
          y={padding.top}
        />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line stroke="#E2E8F0" x1={padding.left} x2={width - padding.right} y1={chart.y(tick)} y2={chart.y(tick)} />
            <text fill="#64748B" fontSize="12" textAnchor="end" x={padding.left - 10} y={chart.y(tick) + 4}>
              {money.format(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text fill="#64748B" fontSize="12" key={tick} textAnchor="middle" x={chart.x(tick)} y={height - 14}>
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
                <circle cx={point.x} cy={point.y} fill="#fff" key={`${item.platform}-${index}`} r="4" stroke={item.color} strokeWidth="3" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-3">
        {series.map((item) => (
          <div className="inline-flex items-center gap-2 text-sm text-slate-600" key={item.platform}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "暂无更新时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
