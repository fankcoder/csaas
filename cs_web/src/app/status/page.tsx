"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type PlatformStatus = {
  platform: string;
  label: string;
  items: number;
  last_updated_at: string | null;
};

type MarketStatus = {
  usd_cny_rate: string;
  total_items: number;
  total_opportunities: number;
  platforms: PlatformStatus[];
  listings: Array<{ platform: string; count: number }>;
};

export default function StatusPage() {
  const [data, setData] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setData(await apiFetch<MarketStatus>("/api/price/status/"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "状态加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="app-page">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Status</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">数据源状态</h1>
          <p className="mt-2 muted-copy">展示平台覆盖数、最后更新时间、机会表规模和当前 USD/CNY 汇率。</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="饰品样本" value={data?.total_items ?? "-"} />
        <Metric label="套利机会" value={data?.total_opportunities ?? "-"} />
        <Metric label="USD/CNY" value={data?.usd_cny_rate ?? "-"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {(data?.platforms ?? []).map((platform) => (
          <div key={platform.platform} className="data-card">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-50 p-2 text-blue-800">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-950">{platform.label}</div>
                <div className="text-sm text-slate-500">{platform.items} 条价格</div>
              </div>
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              最后更新：{platform.last_updated_at ? new Date(platform.last_updated_at).toLocaleString() : "暂无"}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
