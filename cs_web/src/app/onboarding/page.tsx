"use client";

import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type ChecklistItem = {
  key: string;
  label: string;
  group: string;
  is_completed: boolean;
  note: string;
};

type ChecklistResponse = {
  items: ChecklistItem[];
  completed_count: number;
  total_count: number;
  progress_pct: number;
};

export default function OnboardingPage() {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [message, setMessage] = useState("");
  const token = getToken();

  async function load() {
    if (!token) {
      setMessage("请先登录后保存平台开通清单。");
      return;
    }
    try {
      setData(await apiFetch<ChecklistResponse>("/api/auth/checklist/", { token }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "清单加载失败");
    }
  }

  async function toggle(item: ChecklistItem) {
    if (!token) return;
    const payload = await apiFetch<ChecklistResponse>("/api/auth/checklist/", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        key: item.key,
        is_completed: !item.is_completed,
        note: item.note || ""
      })
    });
    setData(payload);
  }

  useEffect(() => {
    load();
  }, []);

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <p className="text-slate-700">{message || "请先登录后进入开通清单。"}</p>
          <Link className="btn-primary mt-4" href="/login">
            登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="eyebrow">Checklist</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">平台开通清单</h1>
        <p className="mt-2 muted-copy">把交易前置条件逐项完成，减少执行套利机会时的账号和支付阻塞。</p>
      </div>

      <section className="section-panel p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2 text-blue-800">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-950">
                {data?.completed_count ?? 0} / {data?.total_count ?? 0} 已完成
              </div>
              <div className="text-sm text-slate-500">进度 {data?.progress_pct ?? 0}%</div>
            </div>
          </div>
          <Link className="btn-secondary" href="/guide">
            查看新手路线
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {(data?.items ?? []).map((item) => (
            <button
              key={item.key}
              className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-200 hover:bg-blue-50/40"
              onClick={() => toggle(item)}
            >
              <span>
                <span className="font-medium text-slate-950">{item.label}</span>
                <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">{item.group}</span>
              </span>
              {item.is_completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-800" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
