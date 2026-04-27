"use client";

import { Calculator } from "lucide-react";
import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });

const platformFees = [
  { value: 0.025, label: "BUFF 2.5%" },
  { value: 0.07, label: "Waxpeer 7%" },
  { value: 0.05, label: "默认 5%" },
  { value: 0, label: "自定义/无手续费" }
];

export default function CostSimulatorPage() {
  const [buyPrice, setBuyPrice] = useState(100);
  const [sellPrice, setSellPrice] = useState(115);
  const [feeRate, setFeeRate] = useState(0.05);
  const [extraCost, setExtraCost] = useState(2);
  const [quantity, setQuantity] = useState(1);

  const result = useMemo(() => {
    const gross = sellPrice * quantity;
    const buyCost = buyPrice * quantity;
    const fee = gross * feeRate;
    const profit = gross - fee - buyCost - extraCost;
    const margin = buyCost > 0 ? (profit / buyCost) * 100 : 0;
    const breakEvenSell = quantity > 0 && feeRate < 1 ? (buyCost + extraCost) / quantity / (1 - feeRate) : 0;
    return { gross, buyCost, fee, profit, margin, breakEvenSell };
  }, [buyPrice, sellPrice, feeRate, extraCost, quantity]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="eyebrow">Calculator</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">套利成本模拟器</h1>
        <p className="mt-2 muted-copy">输入采购价、出售价、手续费和额外成本，快速判断真实净利润。</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="section-panel p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="单件采购价 CNY" value={buyPrice} onChange={setBuyPrice} />
            <NumberField label="单件预期出售价 CNY" value={sellPrice} onChange={setSellPrice} />
            <NumberField label="额外成本 CNY" value={extraCost} onChange={setExtraCost} />
            <NumberField label="数量" value={quantity} onChange={setQuantity} min={1} step={1} />
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-slate-500">出售手续费</span>
              <select
                className="input-control bg-slate-50 focus:bg-white"
                value={feeRate}
                onChange={(event) => setFeeRate(Number(event.target.value))}
              >
                {platformFees.map((fee) => (
                  <option key={fee.label} value={fee.value}>
                    {fee.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="section-panel p-5">
          <div className="mb-4 inline-flex rounded-md bg-blue-50 p-2 text-blue-800">
            <Calculator className="h-5 w-5" />
          </div>
          <Metric label="采购成本" value={money.format(result.buyCost)} />
          <Metric label="出售收入" value={money.format(result.gross)} />
          <Metric label="平台手续费" value={money.format(result.fee)} />
          <Metric label="净利润" value={money.format(result.profit)} strong tone={result.profit >= 0 ? "good" : "bad"} />
          <Metric label="利润率" value={`${result.margin.toFixed(2)}%`} />
          <Metric label="单件保本出售价" value={money.format(result.breakEvenSell)} />
        </section>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 0.01
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="input-control bg-slate-50 focus:bg-white"
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Metric({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "good" | "bad" }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className={`mt-1 ${strong ? "text-2xl font-semibold" : "text-base font-semibold"} ${
          tone === "good" ? "text-blue-800" : tone === "bad" ? "text-rose-700" : "text-slate-950"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
