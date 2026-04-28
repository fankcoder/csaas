import { ArrowRight, Route } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新手套利路线 | CS2 饰品套利数据 SaaS",
  description: "按预算和经验阶段规划 CS2 饰品套利入门路线。"
};

const routes = [
  {
    title: "低预算验证",
    budget: "¥100 - ¥1000",
    text: "优先选择高销量、低单价饰品，目标是熟悉平台充值、购买、出售和提现流程。",
    steps: ["完成平台开通清单", "只看高销量机会", "每次交易后记录真实利润"]
  },
  {
    title: "稳定周转",
    budget: "¥1000 - ¥10000",
    text: "关注利润率和流动性评分的平衡，不追极端价差，控制单个饰品库存占比。",
    steps: ["设置最小销量阈值", "收藏常见高流动性饰品", "按周复盘收益报表"]
  },
  {
    title: "跨境价差",
    budget: "¥10000+",
    text: "重点核算美元汇率、海外平台手续费、提现成本和资金周转周期。",
    steps: ["使用成本模拟器", "关注数据源状态", "分平台评估方向 B 利润"]
  }
];

export default function GuidePage() {
  return (
    <main className="app-page">
      <div className="mb-6">
        <div className="eyebrow">Guide</div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">新手套利路线</h1>
        <p className="mt-2 max-w-3xl muted-copy">
          按预算阶段拆解操作路径，先建立流程熟练度，再逐步提升资金规模和平台覆盖。
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
          开始平台清单
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link className="btn-secondary" href="/arbitrage">
          计算真实利润
        </Link>
      </div>
    </main>
  );
}
