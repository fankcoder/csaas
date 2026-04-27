"use client";

import { Check, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Plan = {
  id: number;
  code: string;
  name: string;
  price_cny: string;
  duration_days: number;
  features: string[];
};

type Paginated<T> = {
  results: T[];
};

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

function rows<T>(payload: T[] | Paginated<T>) {
  return Array.isArray(payload) ? payload : payload.results;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const payload = await apiFetch<Plan[] | Paginated<Plan>>("/api/pay/plans/");
    setPlans(rows(payload));
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : "套餐加载失败"));
  }, []);

  async function subscribe(planId: number) {
    const token = getToken();
    if (!token) {
      setMessage("请先登录后订阅");
      return;
    }
    try {
      const order = await apiFetch<{ id: number }>("/api/pay/orders/", {
        method: "POST",
        token,
        body: JSON.stringify({ plan_id: planId })
      });
      await apiFetch(`/api/pay/orders/${order.id}/mock_paid/`, {
        method: "POST",
        token,
        body: JSON.stringify({})
      });
      setMessage("订阅已生效");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "订阅失败");
    }
  }

  return (
    <main className="app-page">
      <div className="max-w-2xl">
        <div className="eyebrow">Pricing</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">解锁高级套利数据</h1>
        <p className="mt-3 muted-copy">当前版本使用模拟支付，支付成功后自动创建订阅。</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <section key={plan.id} className="data-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{plan.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.duration_days} 天</p>
              </div>
              <div className="font-mono-display text-2xl font-semibold text-blue-800">{money.format(Number(plan.price_cny))}</div>
            </div>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-blue-800" />
                  {feature}
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-6 h-11 w-full"
              onClick={() => subscribe(plan.id)}
            >
              <CreditCard className="h-4 w-4" />
              模拟支付
            </button>
          </section>
        ))}
      </div>
      {message ? (
        <div className="section-panel mt-5 p-4 text-sm text-slate-700">
          {message}
          {message.includes("登录") ? (
            <Link className="ml-3 font-semibold text-blue-800" href="/login">
              去登录
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
