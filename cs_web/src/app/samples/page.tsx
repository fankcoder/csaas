"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type SampleOpportunity = {
  id: number;
  market_hash_name: string;
  market_name_cn?: string | null;
  buy_platform_label: string;
  sell_platform_label: string;
  buy_price_cny: string;
  sell_net_cny: string;
  profit_cny: string;
  margin_pct: string;
  liquidity_score: number;
  risk_flags: string[];
};

type SampleResponse = {
  count: number;
  sample: boolean;
  upgrade_required_for_full_data: boolean;
  results: SampleOpportunity[];
};

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

export default function SamplesPage() {
  const [data, setData] = useState<SampleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setData(await apiFetch<SampleResponse>("/api/price/arbitrage-sample/?limit=5"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "样例榜加载失败");
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
          <div className="eyebrow">Free sample</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">免费样例利润榜</h1>
          <p className="mt-2 muted-copy">未订阅用户可查看 Top 5 样例机会，完整分页和筛选需要订阅。</p>
        </div>
        <button
          className="btn-secondary"
          onClick={load}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="section-panel overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3">饰品</th>
              <th className="px-4 py-3">方向</th>
              <th className="px-4 py-3">利润</th>
              <th className="px-4 py-3">流动性</th>
              <th className="px-4 py-3">风险</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.results ?? []).map((item) => (
              <tr key={item.id} className="transition-colors duration-200 hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-950">{item.market_name_cn || item.market_hash_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.market_hash_name}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.buy_platform_label} → {item.sell_platform_label}
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono-display font-semibold text-blue-800">{money.format(Number(item.profit_cny))}</div>
                  <div className="text-xs text-slate-500">{Number(item.margin_pct).toFixed(2)}%</div>
                </td>
                <td className="px-4 py-3 font-mono-display font-semibold text-blue-800">{item.liquidity_score}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{item.risk_flags.join(", ") || "normal"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Link
        className="btn-primary mt-5"
        href="/pricing"
      >
        解锁完整利润榜
        <ExternalLink className="h-4 w-4" />
      </Link>
    </main>
  );
}
