"use client";

import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState, MetricTile, Notice, PageBody, PageHero, Panel, cx } from "@/components/FVPage";
import { apiFetch } from "@/lib/api";
import { formatCny, formatPercent } from "@/lib/format";

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
      setMessage(err instanceof Error ? err.message : "Failed to load sample deals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="bg-[#050711] text-white">
      <PageHero
        eyebrow="Free Sample"
        title="Live sample deals"
        description="Preview the same deal scoring model used in the full terminal. The free view is intentionally limited to a small set of opportunities."
        actions={
          <>
            <button className="btn-secondary" onClick={load}>
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <Link className="btn-primary" href="/pricing">
              Unlock full table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      >
        <Panel className="grid gap-3 p-4">
          <MetricTile label="Visible sample" value={data?.results.length ?? 0} detail="Free preview limit" />
          <MetricTile label="Total sample pool" value={data?.count ?? "-"} tone="cyan" />
        </Panel>
      </PageHero>

      <PageBody>
        {message ? <Notice tone="warning">{message}</Notice> : null}

        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] table-fixed divide-y divide-white/10 text-sm">
              <thead className="table-header">
                <tr>
                  <th className="w-[320px] px-4 py-3">Item</th>
                  <th className="w-[220px] px-4 py-3">Route</th>
                  <th className="w-[150px] px-4 py-3 text-right">Profit</th>
                  <th className="w-[120px] px-4 py-3 text-right">Liquidity</th>
                  <th className="w-[160px] px-4 py-3">Risk flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(data?.results ?? []).map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-white/[0.04]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{item.market_hash_name}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.market_hash_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="text-lime-200">{item.buy_platform_label}</span>
                      <span className="mx-2 text-slate-500">to</span>
                      <span className="text-cyan-200">{item.sell_platform_label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono-display font-semibold text-lime-200">{formatCny(item.profit_cny)}</div>
                      <div className="text-xs text-slate-500">{formatPercent(item.margin_pct)}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-display font-semibold text-cyan-200">{item.liquidity_score}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.risk_flags.join(", ") || "normal"}</td>
                  </tr>
                ))}
                {!loading && (data?.results ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="No sample deals yet" description="Run the backend profit calculation task and refresh this page." />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Link className="btn-primary w-fit" href="/pricing">
          Upgrade for all opportunities
          <ExternalLink className="h-4 w-4" />
        </Link>
      </PageBody>
    </main>
  );
}
