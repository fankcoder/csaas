"use client";

import { ArrowRight, BadgeCheck, Check, CreditCard, Loader2, LockKeyhole, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Plan = {
  id: number;
  code: "free" | "pro" | "elite" | string;
  name: string;
  price_cny: string;
  duration_days: number;
  features: string[];
};

type Paginated<T> = {
  results: T[];
};

type SubscriptionPayload = {
  active: boolean;
  subscription?: {
    plan?: Plan;
    status: string;
    current_period_end: string;
  } | null;
};

type OrderPayload = {
  id: number;
  plan: Plan;
  status: string;
  provider: string;
  payment_url: string;
};

const pricingCatalog = [
  {
    code: "free",
    name: "Free",
    price: "$0",
    description: "Top 5 deals, hourly refresh, basic market data",
    badge: "Explore",
    cta: "Start free",
    accent: "from-slate-400/20 to-slate-500/10",
    icon: Sparkles,
    featured: false,
    bullets: ["Top 5 visible opportunities", "Hourly market refresh", "Basic route and liquidity data"],
  },
  {
    code: "pro",
    name: "Pro",
    price: "$29",
    description: "All deals, 30 min refresh, 90 days analytics",
    badge: "Most popular",
    cta: "Upgrade to Pro",
    accent: "from-lime-300/25 to-cyan-300/10",
    icon: Zap,
    featured: true,
    bullets: ["Full arbitrage table", "30 minute market refresh", "90 days of analytics history"],
  },
  {
    code: "elite",
    name: "Elite",
    price: "$79",
    description: "Real-time alerts, exports, API access, 365 days history",
    badge: "Scale",
    cta: "Go Elite",
    accent: "from-cyan-300/25 to-blue-400/10",
    icon: ShieldCheck,
    featured: false,
    bullets: ["Real-time opportunity alerts", "CSV exports and API access", "365 days of history"],
  },
] as const;

function rows<T>(payload: T[] | Paginated<T>) {
  return Array.isArray(payload) ? payload : payload.results;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const planByCode = useMemo(() => {
    return new Map(plans.map((plan) => [plan.code, plan]));
  }, [plans]);

  async function load() {
    setLoadingPlans(true);
    try {
      const payload = await apiFetch<Plan[] | Paginated<Plan>>("/api/pay/plans/");
      setPlans(rows(payload).filter((plan) => ["free", "pro", "elite"].includes(plan.code)));

      const token = getToken();
      if (token) {
        const subscription = await apiFetch<SubscriptionPayload>("/api/pay/subscription/", { token });
        setActivePlanCode(subscription.active ? subscription.subscription?.plan?.code ?? null : null);
      }
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Failed to load pricing plans."
      });
    } finally {
      setLoadingPlans(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function checkout(planCode: string) {
    const token = getToken();
    const plan = planByCode.get(planCode);

    if (!token) {
      setMessage({ tone: "warning", text: "Please log in before choosing a plan." });
      return;
    }

    if (!plan) {
      setMessage({ tone: "error", text: "This plan is not available yet. Please refresh and try again." });
      return;
    }

    setBusyCode(planCode);
    setMessage(null);
    try {
      const order = await apiFetch<OrderPayload>("/api/pay/orders/", {
        method: "POST",
        token,
        body: JSON.stringify({ plan_id: plan.id })
      });

      if (order.status === "paid") {
        setActivePlanCode(order.plan.code);
        setMessage({
          tone: "success",
          text: `${order.plan.name} is active.`
        });
        return;
      }

      if (order.payment_url) {
        window.location.href = order.payment_url;
        return;
      }

      setMessage({
        tone: "error",
        text: "PayPal did not return a checkout link. Please try again."
      });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "PayPal checkout failed."
      });
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <main className="app-page">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080c16] px-5 py-8 text-white shadow-[0_28px_110px_rgba(0,0,0,0.34)] sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(190,242,100,0.18),transparent_28rem),radial-gradient(circle_at_88%_0%,rgba(103,232,249,0.16),transparent_30rem)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_360px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-sm font-semibold text-lime-100">
              <CreditCard className="h-4 w-4" />
              PayPal sandbox checkout
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Choose the plan that matches your CS2 arbitrage workflow.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Start with limited market visibility, then unlock deeper coverage, faster refreshes, alerts, exports, and API access as your workflow matures.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-slate-950">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-white">Production-style billing flow</div>
                <div className="text-sm text-slate-400">Sandbox payments only in this build.</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <TrustLine label="Instant plan activation after PayPal capture" />
              <TrustLine label="Subscription state is stored on your account" />
              <TrustLine label="Manual trading only. No asset custody." />
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-lime-300/25 bg-lime-300/10 text-lime-100"
              : message.tone === "warning"
                ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                : "border-rose-300/25 bg-rose-300/10 text-rose-100"
          }`}
        >
          {message.text}
          {message.tone === "warning" ? (
            <Link className="ml-3 font-semibold text-lime-100 underline decoration-lime-200/40 underline-offset-4" href="/login">
              Log in
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {pricingCatalog.map((tier) => {
          const Icon = tier.icon;
          const plan = planByCode.get(tier.code);
          const isCurrent = activePlanCode === tier.code;
          const isBusy = busyCode === tier.code;

          return (
            <article
              className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl border p-6 shadow-[0_26px_80px_rgba(0,0,0,0.26)] ${
                tier.featured
                  ? "border-lime-300/45 bg-white/[0.075]"
                  : "border-white/10 bg-white/[0.045]"
              }`}
              key={tier.code}
            >
              <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${tier.accent}`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 text-lime-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tier.featured ? "bg-lime-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                    {isCurrent ? "Current plan" : tier.badge}
                  </div>
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-white">{tier.name}</h2>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{tier.description}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-semibold text-white">{tier.price}</span>
                  <span className="pb-2 text-sm font-medium text-slate-400">/mo</span>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {tier.bullets.map((feature) => (
                  <div className="flex gap-3 text-sm leading-6 text-slate-200" key={feature}>
                    <Check className="mt-1 h-4 w-4 shrink-0 text-lime-200" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <button
                  className={tier.featured ? "btn-primary h-12 w-full" : "btn-secondary h-12 w-full"}
                  disabled={loadingPlans || isBusy || isCurrent || !plan}
                  onClick={() => checkout(tier.code)}
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? <BadgeCheck className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {isBusy ? "Processing..." : isCurrent ? "Active now" : plan ? tier.cta : "Unavailable"}
                  {!isBusy && !isCurrent ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">
                  {tier.code === "free" ? "Free activation, no payment method needed." : "Secure checkout through PayPal sandbox."}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-300/10 p-2 text-cyan-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">What happens after checkout?</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ProcessStep step="1" title="Choose plan" text="Select Free, Pro, or Elite from the billing cards." />
            <ProcessStep step="2" title="PayPal checkout" text="Approve the sandbox payment on PayPal." />
            <ProcessStep step="3" title="Access unlocks" text="We capture the order and activate your subscription." />
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-semibold text-white">Plan fit</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <p><span className="font-semibold text-white">Free</span> is for checking whether the signal quality is useful.</p>
            <p><span className="font-semibold text-white">Pro</span> is the default paid workflow for active deal discovery.</p>
            <p><span className="font-semibold text-white">Elite</span> is for automation-adjacent teams that need alerts, exports, and API access.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <BadgeCheck className="h-4 w-4 text-lime-200" />
      <span>{label}</span>
    </div>
  );
}

function ProcessStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 text-sm font-bold text-slate-950">{step}</div>
      <div className="mt-4 font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
