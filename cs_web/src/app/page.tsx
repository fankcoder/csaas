import {
  ArrowRight,
  BarChart3,
  Bell,
  Calculator,
  DatabaseZap,
  LineChart,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Star
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const stats = [
  ["23K+", "价格样本"],
  ["1K+", "利润方向"],
  ["4", "核心市场"],
  ["0-100", "流动性评分"]
];

const workflows = [
  {
    title: "发现机会",
    text: "按饰品、销量、出售平台筛选利润方向，方向 A 取最低采购价，方向 B 分平台计算净利润。",
    icon: <Radar className="h-5 w-5" />
  },
  {
    title: "评估风险",
    text: "把销量、平台覆盖、更新时间、异常利润率转成风险标签，减少不可成交机会的干扰。",
    icon: <ShieldCheck className="h-5 w-5" />
  },
  {
    title: "跟踪收益",
    text: "收藏套利方向，记录真实买入和卖出，沉淀自己的交易复盘数据。",
    icon: <LineChart className="h-5 w-5" />
  }
];

export default function Page() {
  return (
    <main>
      <section className="relative overflow-hidden bg-ink-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.98),rgba(7,17,31,0.82),rgba(7,17,31,0.55))]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-300/30 bg-blue-300/10 px-3 py-2 text-sm font-medium text-blue-100">
              <DatabaseZap className="h-4 w-4" />
              CS2 跨市场套利数据终端
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-white sm:text-6xl">
              从价格差到可执行利润
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              对比 BUFF、悠悠有品、Waxpeer、ShadowPay 的价格、销量和手续费，把饰品套利机会转成可筛选、可收藏、可复盘的数据工作台。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition-colors duration-200 hover:bg-amber-400" href="/samples">
                查看免费样例
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-white/15" href="/tools/cost-simulator">
                成本模拟器
              </Link>
            </div>
            <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="font-mono-display text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/10 p-5 text-white shadow-glow backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-100">Live snapshot</div>
                <div className="font-mono-display text-lg font-semibold">Profit Radar</div>
              </div>
              <BarChart3 className="h-6 w-6 text-amber-300" />
            </div>
            <div className="space-y-3">
              <Signal label="BUFF → ShadowPay" value="+12.4%" width="86%" tone="bg-amber-400" />
              <Signal label="BUFF → Waxpeer" value="+7.8%" width="64%" tone="bg-blue-300" />
              <Signal label="YouPin → BUFF" value="+3.6%" width="38%" tone="bg-emerald-300" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <MiniMetric label="Risk flags" value="4 rules" />
              <MiniMetric label="Status" value="Fresh" />
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-slate-50 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {workflows.map((item) => (
            <Feature key={item.title} icon={item.icon} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <QuickAction href="/arbitrage" icon={<LockKeyhole className="h-5 w-5" />} title="完整利润榜" text="订阅用户使用分页、搜索和方向 B 平台筛选。" />
          <QuickAction href="/favorites" icon={<Star className="h-5 w-5" />} title="机会收藏" text="持续跟踪关注饰品的利润变化。" />
          <QuickAction href="/reports" icon={<LineChart className="h-5 w-5" />} title="收益报表" text="记录真实成交，校准模型和交易策略。" />
          <QuickAction href="/status" icon={<Bell className="h-5 w-5" />} title="数据状态" text="查看平台覆盖、更新时间和汇率口径。" />
        </div>
      </section>
    </main>
  );
}

function Signal({ label, value, width, tone }: { label: string; value: string; width: string; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="font-mono-display font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className={`h-2 rounded-full ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-1 font-mono-display font-semibold">{value}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="data-card">
      <div className="mb-4 inline-flex rounded-md bg-blue-50 p-2 text-blue-800">{icon}</div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 muted-copy">{text}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link className="data-card block" href={href}>
      <div className="mb-4 inline-flex rounded-md bg-amber-50 p-2 text-amber-700">{icon}</div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 muted-copy">{text}</p>
    </Link>
  );
}
