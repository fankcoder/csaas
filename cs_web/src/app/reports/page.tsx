"use client";

import { BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type TradeRecord = {
  id: number;
  iteminfo: {
    id: number;
    market_hash_name: string;
    market_name_cn?: string | null;
  };
  direction_a_platform: string;
  direction_b_platform: string;
  buy_price_cny: string;
  sell_price_cny: string;
  sell_fee_cny: string;
  other_cost_cny: string;
  quantity: number;
  realized_profit_cny: string;
  traded_at: string;
  note: string;
};

type Paginated<T> = {
  results: T[];
};

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

const initialFormShape = {
  iteminfo_id: "",
  direction_a_platform: "buff",
  direction_b_platform: "shadowpay",
  buy_price_cny: "100",
  sell_price_cny: "120",
  sell_fee_cny: "6",
  other_cost_cny: "0",
  quantity: "1",
  traded_at: "",
  note: ""
};

type TradeForm = typeof initialFormShape;

export default function ReportsPage() {
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<TradeForm>({
    ...initialFormShape,
    traded_at: new Date().toISOString().slice(0, 16)
  });
  const token = getToken();

  const totalProfit = useMemo(
    () => records.reduce((sum, item) => sum + Number(item.realized_profit_cny), 0),
    [records]
  );

  async function load() {
    if (!token) {
      setMessage("请先登录后查看收益报表。");
      return;
    }
    const payload = await apiFetch<TradeRecord[] | Paginated<TradeRecord>>("/api/price/trade-records/", { token });
    setRecords(Array.isArray(payload) ? payload : payload.results);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiFetch("/api/price/trade-records/", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...form,
          iteminfo_id: Number(form.iteminfo_id),
          quantity: Number(form.quantity),
          traded_at: new Date(form.traded_at).toISOString()
        })
      });
      setMessage("交易记录已保存");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "交易记录保存失败");
    }
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : "收益记录加载失败"));
  }, []);

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <p>{message || "请先登录。"}</p>
          <Link className="btn-primary mt-4" href="/login">
            登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Report</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">用户收益报表</h1>
        <p className="mt-2 muted-copy">记录真实买入、卖出、费用和数量，复盘实际收益。</p>
      </div>

      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</div> : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="记录数" value={records.length} />
        <Metric label="累计利润" value={money.format(totalProfit)} />
        <Metric label="平均利润" value={money.format(records.length ? totalProfit / records.length : 0)} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form className="section-panel p-5" onSubmit={submit}>
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
            <Plus className="h-5 w-5" />
            新增交易记录
          </div>
          <Input label="Iteminfo ID" name="iteminfo_id" form={form} setForm={setForm} />
          <Input label="采购平台" name="direction_a_platform" form={form} setForm={setForm} />
          <Input label="出售平台" name="direction_b_platform" form={form} setForm={setForm} />
          <Input label="买入价 CNY" name="buy_price_cny" form={form} setForm={setForm} type="number" />
          <Input label="卖出价 CNY" name="sell_price_cny" form={form} setForm={setForm} type="number" />
          <Input label="手续费 CNY" name="sell_fee_cny" form={form} setForm={setForm} type="number" />
          <Input label="其他成本 CNY" name="other_cost_cny" form={form} setForm={setForm} type="number" />
          <Input label="数量" name="quantity" form={form} setForm={setForm} type="number" />
          <Input label="成交时间" name="traded_at" form={form} setForm={setForm} type="datetime-local" />
          <Input label="备注" name="note" form={form} setForm={setForm} />
          <button className="btn-primary mt-3 w-full">
            保存记录
          </button>
        </form>

        <section className="section-panel">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 font-semibold text-slate-950">
            <BarChart3 className="h-5 w-5" />
            历史记录
          </div>
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <div key={record.id} className="grid gap-2 p-4 text-sm transition-colors duration-200 hover:bg-blue-50/40 md:grid-cols-[minmax(0,1fr)_120px_120px]">
                <div>
                  <div className="font-semibold text-slate-950">{record.iteminfo.market_hash_name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {record.direction_a_platform} → {record.direction_b_platform} · {new Date(record.traded_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-slate-600">数量 {record.quantity}</div>
                <div className="font-mono-display font-semibold text-blue-800">{money.format(Number(record.realized_profit_cny))}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
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

function Input({
  label,
  name,
  form,
  setForm,
  type = "text"
}: {
  label: string;
  name: keyof TradeForm;
  form: TradeForm;
  setForm: Dispatch<SetStateAction<TradeForm>>;
  type?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="input-control mt-1 bg-slate-50 focus:bg-white"
        type={type}
        value={form[name]}
        onChange={(event) => setForm({ ...form, [name]: event.target.value })}
      />
    </label>
  );
}
