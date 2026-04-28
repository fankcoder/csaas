import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Gauge,
  Globe2,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketStatusStrip } from "@/components/MarketStatusStrip";

export const metadata: Metadata = {
  title: "FloatVia - CS2 Skin Arbitrage Analytics",
  description:
    "Cross-market CS2 skin arbitrage analytics across Chinese and global marketplaces including BUFF, YouPin, Waxpeer and ShadowPay.",
  keywords: ["CS2 skin arbitrage", "BUFF arbitrage", "Waxpeer analytics", "CS2 skin trading", "FloatVia"]
};

const marketRows = [
  { from: "BUFF", to: "ShadowPay", item: "AK-47 | Bloodsport", profit: "+$18.42", score: "92", freshness: "41s" },
  { from: "YouPin", to: "Waxpeer", item: "M4A1-S | Printstream", profit: "+$11.08", score: "87", freshness: "2m" },
  { from: "Waxpeer", to: "BUFF", item: "Karambit | Doppler", profit: "+$74.60", score: "81", freshness: "4m" },
  { from: "BUFF", to: "Steam", item: "AWP | Asiimov", profit: "+$8.19", score: "76", freshness: "5m" }
];

const platforms = ["BUFF", "YouPin", "C5", "IGXE", "Waxpeer", "ShadowPay", "Steam", "CSFloat"];

const featureBlocks = [
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: "China plus global coverage",
    text: "Track the market gap SkinEdge misses: Chinese liquidity against global USD venues."
  },
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "Executable deal scoring",
    text: "Rank opportunities by net profit, volume, freshness, fee impact and market direction."
  },
  {
    icon: <Timer className="h-5 w-5" />,
    title: "History that compounds",
    text: "Build 30-minute snapshots into trend lines, sell-speed signals and future alerts."
  }
];

export default function Page() {
  return (
    <main className="overflow-hidden bg-[#050711] text-white">
      <section className="relative border-b border-white/10">
        <MarketScene />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-8 pt-12 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-sm font-semibold text-lime-100">
              <Radar className="h-4 w-4" />
              Cross-border CS2 skin intelligence
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              FloatVia
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-200">
              Find profitable CS2 skin routes across Chinese and global marketplaces before the spread disappears.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-lime-300 px-5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-lime-200"
                href="/samples"
              >
                View live sample deals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/15"
                href="/pricing"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <MobileDealStrip />
          <div className="mt-8 hidden gap-4 md:grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <LiveBoard />
            <SignalPanel />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080b15]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-lime-200">Market coverage</div>
              <p className="mt-1 text-sm text-slate-400">Domestic liquidity meets global exit routes.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
              <BellRing className="h-4 w-4 text-lime-200" />
              Alerts and faster refresh are next on the roadmap
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {platforms.map((platform, index) => (
              <div
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-sm font-semibold text-slate-100"
                key={platform}
              >
                <span className={index < 4 ? "text-lime-200" : "text-cyan-200"}>{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050711] py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {featureBlocks.map((feature) => (
            <FeatureBlock key={feature.title} icon={feature.icon} title={feature.title} text={feature.text} />
          ))}
        </div>
      </section>

      <MarketStatusStrip />

      <section className="bg-[#050711] py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <QuickAction href="/arbitrage" icon={<LockKeyhole className="h-5 w-5" />} title="Full deal table" text="Search, filter and compare every direction." />
          <QuickAction href="/samples" icon={<Globe2 className="h-5 w-5" />} title="Sample routes" text="Preview representative spreads before subscribing." />
          <QuickAction href="/pricing" icon={<Timer className="h-5 w-5" />} title="Plan access" text="Unlock the full table and faster workflow." />
          <QuickAction href="/disclaimer" icon={<ShieldCheck className="h-5 w-5" />} title="Clear boundaries" text="Data only. No custody. No auto-trading." />
        </div>
      </section>
    </main>
  );
}

function MarketScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="market-grid absolute inset-0" />
      <div className="absolute left-[9%] top-24 h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_22px_rgba(190,242,100,0.9)]" />
      <div className="absolute left-[42%] top-48 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
      <div className="absolute right-[12%] top-32 h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_22px_rgba(253,164,175,0.85)]" />
      <div className="route-line route-line-a" />
      <div className="route-line route-line-b" />
      <div className="route-line route-line-c" />
      <div className="deal-tape deal-tape-left">
        {["BUFF +12.4%", "YOUPIN +7.1%", "C5 +4.6%", "IGXE +3.8%"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="deal-tape deal-tape-right">
        {["WAXPEER", "SHADOWPAY", "STEAM", "CSFLOAT"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function LiveBoard() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1020]/86 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-lime-200">Live route board</div>
          <div className="mt-1 text-xs text-slate-400">Sample presentation only. Real execution requires manual verification.</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Fresh
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] table-fixed text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-[170px] py-2">Route</th>
              <th className="w-[260px] py-2">Item</th>
              <th className="w-[100px] py-2 text-right">Profit</th>
              <th className="w-[100px] py-2 text-right">Score</th>
              <th className="w-[100px] py-2 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {marketRows.map((row) => (
              <tr className="text-slate-200" key={`${row.from}-${row.to}-${row.item}`}>
                <td className="py-3">
                  <span className="text-lime-200">{row.from}</span>
                  <span className="mx-2 text-slate-500">to</span>
                  <span className="text-cyan-200">{row.to}</span>
                </td>
                <td className="truncate py-3 pr-3">{row.item}</td>
                <td className="py-3 text-right font-mono-display font-semibold text-lime-200">{row.profit}</td>
                <td className="py-3 text-right font-mono-display">{row.score}</td>
                <td className="py-3 text-right text-slate-400">{row.freshness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileDealStrip() {
  return (
    <div className="mt-8 grid gap-2 md:hidden">
      {marketRows.slice(0, 2).map((row) => (
        <div className="rounded-md border border-white/10 bg-white/[0.06] p-3" key={`${row.from}-${row.to}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-slate-200">
              <span className="text-lime-200">{row.from}</span>
              <span className="mx-2 text-slate-500">to</span>
              <span className="text-cyan-200">{row.to}</span>
            </span>
            <span className="font-mono-display font-semibold text-lime-200">{row.profit}</span>
          </div>
          <div className="mt-1 truncate text-xs text-slate-500">{row.item}</div>
        </div>
      ))}
    </div>
  );
}

function SignalPanel() {
  const checks = ["Net price after fees", "China/global route split", "Volume-aware filtering", "Snapshot-backed trends"];
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Deal confidence</div>
          <div className="mt-1 text-xs text-slate-400">Simple, explainable, auditable.</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-lime-300 text-slate-950">
          <Gauge className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div className="flex items-center gap-2 text-sm text-slate-300" key={check}>
            <CheckCircle2 className="h-4 w-4 text-lime-200" />
            {check}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-md border border-white/10 bg-[#050711] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Cross-market spread</span>
          <span className="font-mono-display font-semibold text-white">+8.6%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-2 w-[72%] rounded-full bg-lime-300" />
        </div>
      </div>
    </div>
  );
}

function FeatureBlock({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 transition-colors duration-150 hover:border-lime-300/35">
      <div className="mb-5 inline-flex rounded-md bg-lime-300/10 p-2 text-lime-200">{icon}</div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link className="block rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors duration-150 hover:border-cyan-300/35" href={href}>
      <div className="mb-4 inline-flex rounded-md bg-cyan-300/10 p-2 text-cyan-200">{icon}</div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </Link>
  );
}
