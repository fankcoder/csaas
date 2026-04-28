import { ArrowRight, Route } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beginner Arbitrage Roadmap | FloatVia CS2 Skin Arbitrage SaaS",
  description: "Plan a beginner-friendly CS2 skin arbitrage path by budget, experience level, liquidity, and execution risk."
};

const routes = [
  {
    title: "Low-Budget Validation",
    budget: "$15 - $150",
    text: "Start with high-volume, low-price items. The goal is to learn deposits, purchases, listings, sales, withdrawals, and fee impact before scaling.",
    steps: ["Complete the platform setup checklist", "Only review high-liquidity opportunities", "Record realized profit after each trade"]
  },
  {
    title: "Stable Rotation",
    budget: "$150 - $1,500",
    text: "Balance margin with liquidity score. Avoid chasing extreme spreads, and keep each item from becoming too large a share of your inventory.",
    steps: ["Set a minimum volume threshold", "Save common high-liquidity items", "Review profit reports every week"]
  },
  {
    title: "Cross-Market Spreads",
    budget: "$1,500+",
    text: "Pay close attention to USD exchange rates, marketplace fees, withdrawal costs, and capital turnover time across global platforms.",
    steps: ["Model all costs before buying", "Watch data-source freshness", "Evaluate Direction B profit by sell platform"]
  }
];

export default function GuidePage() {
  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Guide</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Beginner Arbitrage Roadmap</h1>
        <p className="mt-2 max-w-3xl muted-copy">
          Break the workflow into budget stages: build execution confidence first, then gradually increase capital size and marketplace coverage.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {routes.map((item) => (
          <article key={item.title} className="data-card">
            <div className="mb-4 inline-flex rounded-md bg-blue-50 p-2 text-blue-800">
              <Route className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-slate-500">{item.budget}</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-3 muted-copy">{item.text}</p>
            <div className="mt-4 space-y-2">
              {item.steps.map((step) => (
                <div key={step} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {step}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn-primary" href="/onboarding">
          Start setup checklist
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link className="btn-secondary" href="/arbitrage">
          Calculate real profit
        </Link>
      </div>
    </main>
  );
}
