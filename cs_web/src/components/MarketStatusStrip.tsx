"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

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
};

export function MarketStatusStrip() {
  const [data, setData] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setData(await apiFetch<MarketStatus>("/api/price/status/"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Status data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latestUpdates = data?.platforms
    ?.map((platform) => platform.last_updated_at)
    .filter(Boolean)
    .sort();
  const latest = latestUpdates?.[latestUpdates.length - 1];

  return (
    <section className="border-y border-white/10 bg-[#080b15] py-12">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
            <Activity className="h-4 w-4" />
            Market freshness
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-white">Core data status, right on the homepage.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Track source coverage, active opportunity volume and the current USD/CNY assumption without leaving the main flow.
          </p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/15" onClick={load}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {message ? <div className="mt-3 text-sm text-rose-200">{message}</div> : null}
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatusMetric label="Tracked items" value={data?.total_items ?? "-"} />
            <StatusMetric label="Opportunities" value={data?.total_opportunities ?? "-"} tone="cyan" />
            <StatusMetric label="USD/CNY" value={data?.usd_cny_rate ?? "-"} />
            <StatusMetric label="Latest update" value={latest ? formatDateTime(latest) : "-"} tone="slate" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.platforms ?? []).slice(0, 6).map((platform) => (
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4" key={platform.platform}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{platform.label}</div>
                  <div className="font-mono-display text-sm text-lime-200">{platform.items}</div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Updated {formatDateTime(platform.last_updated_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusMetric({ label, value, tone = "lime" }: { label: string; value: string | number; tone?: "lime" | "cyan" | "slate" }) {
  const toneClass = tone === "cyan" ? "text-cyan-200" : tone === "slate" ? "text-white" : "text-lime-200";

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-2 font-mono-display text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
