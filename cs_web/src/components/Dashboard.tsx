"use client";

import {
  ArrowRightLeft,
  CircleDollarSign,
  CreditCard,
  Filter,
  Loader2,
  LogIn,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserPlus
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { API_BASE_URL, apiFetch } from "@/lib/api";

type Opportunity = {
  iteminfo_id: number;
  market_hash_name: string;
  market_name_cn?: string | null;
  icon_url?: string | null;
  quality?: string | null;
  quality_color?: string | null;
  category?: string | null;
  buy_platform_label: string;
  buy_price_cny: string;
  buy_source_price: string;
  buy_source_currency: string;
  buy_volume: number;
  sell_platform_label: string;
  sell_price_cny: string;
  sell_source_price: string;
  sell_source_currency: string;
  sell_volume: number;
  sell_fee_rate: string;
  sell_net_cny: string;
  profit_cny: string;
  margin_pct: string;
};

type ArbitrageResponse = {
  count: number;
  usd_cny_rate: string;
  min_volume: number;
  results: Opportunity[];
};

type Summary = {
  items: number;
  with_buff: number;
  with_waxpeer: number;
  with_shadowpay: number;
};

type Plan = {
  id: number;
  code: string;
  name: string;
  price_cny: string;
  duration_days: number;
  features: string[];
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type AuthResponse = {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
};

const cny = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2
});

function money(value: string | number) {
  return cny.format(Number(value));
}

function pct(value: string | number) {
  return `${Number(value).toFixed(2)}%`;
}

function responseItems<T>(payload: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export function Dashboard() {
  const [q, setQ] = useState("");
  const [minVolume, setMinVolume] = useState(1);
  const [minProfit, setMinProfit] = useState(0);
  const [usdCnyRate, setUsdCnyRate] = useState("7.25");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  const bestProfit = useMemo(() => {
    if (!opportunities.length) return 0;
    return Math.max(...opportunities.map((item) => Number(item.profit_cny)));
  }, [opportunities]);

  async function loadData() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      q,
      min_volume: String(minVolume),
      min_profit: String(minProfit),
      usd_cny_rate: usdCnyRate,
      limit: "100"
    });

    try {
      const [arbitrage, marketSummary, planList] = await Promise.all([
        apiFetch<ArbitrageResponse>(`/api/price/arbitrage/?${params.toString()}`),
        apiFetch<Summary>("/api/price/summary/"),
        apiFetch<Plan[] | PaginatedResponse<Plan>>("/api/pay/plans/")
      ]);
      setOpportunities(arbitrage.results);
      setSummary(marketSummary);
      setPlans(responseItems(planList));
    } catch (err) {
      setError(err instanceof Error ? err.message : "数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem("cs2_token");
    const savedUser = window.localStorage.getItem("cs2_user");
    if (savedToken) setToken(savedToken);
    if (savedUser) setCurrentUser(savedUser);
    loadData();
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    const payload =
      authMode === "register"
        ? { username, email, password }
        : { username, password };

    try {
      const data = await apiFetch<AuthResponse>(`/api/auth/${authMode}/`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setToken(data.token);
      setCurrentUser(data.user.username);
      window.localStorage.setItem("cs2_token", data.token);
      window.localStorage.setItem("cs2_user", data.user.username);
      setAuthMessage(authMode === "register" ? "注册成功，已登录" : "登录成功");
      setPassword("");
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : "认证失败");
    }
  }

  function logout() {
    setToken(null);
    setCurrentUser(null);
    window.localStorage.removeItem("cs2_token");
    window.localStorage.removeItem("cs2_user");
  }

  async function createOrder(planId: number) {
    setOrderMessage("");
    if (!token) {
      setOrderMessage("请先登录后再订阅套餐");
      return;
    }

    try {
      const order = await apiFetch<{ id: number; payment_url: string; status: string }>(
        "/api/pay/orders/",
        {
          method: "POST",
          token,
          body: JSON.stringify({ plan_id: planId })
        }
      );
      setOrderMessage(`订单 #${order.id} 已创建，状态：${order.status}`);
    } catch (err) {
      setOrderMessage(err instanceof Error ? err.message : "订单创建失败");
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <ArrowRightLeft className="h-4 w-4" />
              跨平台套利工作台
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              CS2 饰品价格差与利润排序
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2">
              API：{API_BASE_URL}
            </span>
            {currentUser ? (
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 font-medium text-white"
                onClick={logout}
              >
                <ShieldCheck className="h-4 w-4" />
                {currentUser}
              </button>
            ) : (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                未登录
              </span>
            )}
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="可套利机会" value={opportunities.length} tone="emerald" />
          <MetricCard icon={<CircleDollarSign className="h-5 w-5" />} label="最高单件利润" value={money(bestProfit)} tone="sky" />
          <MetricCard icon={<Filter className="h-5 w-5" />} label="饰品样本" value={summary?.items ?? "-"} tone="slate" />
          <MetricCard icon={<ShieldCheck className="h-5 w-5" />} label="Waxpeer 覆盖" value={summary?.with_waxpeer ?? "-"} tone="rose" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <form
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel"
              onSubmit={(event) => {
                event.preventDefault();
                loadData();
              }}
            >
              <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_140px_140px_140px_auto] md:items-end">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">饰品名称</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="AK-47、AWP、渐变之色"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                    />
                  </div>
                </label>
                <NumberField label="最低销量" value={minVolume} onChange={setMinVolume} min={0} />
                <NumberField label="最低利润" value={minProfit} onChange={setMinProfit} min={0} />
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">美元汇率</span>
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-emerald-500 focus:bg-white"
                    value={usdCnyRate}
                    onChange={(event) => setUsdCnyRate(event.target.value)}
                  />
                </label>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  刷新
                </button>
              </div>
              {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
            </form>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">利润榜</h2>
                  <p className="text-sm text-slate-500">已排除销量低于阈值的平台报价</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[960px] table-fixed divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="w-[280px] px-4 py-3">饰品</th>
                      <th className="w-[160px] px-4 py-3">采购</th>
                      <th className="w-[160px] px-4 py-3">出售</th>
                      <th className="w-[120px] px-4 py-3">手续费后</th>
                      <th className="w-[120px] px-4 py-3">利润</th>
                      <th className="w-[100px] px-4 py-3">利润率</th>
                      <th className="w-[120px] px-4 py-3">销量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunities.map((item) => (
                      <tr key={`${item.iteminfo_id}-${item.buy_platform_label}-${item.sell_platform_label}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-950">{item.market_name_cn || item.market_hash_name}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{item.market_hash_name}</div>
                          <div className="mt-2 flex gap-2">
                            {item.category ? <Tag>{item.category}</Tag> : null}
                            {item.quality ? <Tag>{item.quality}</Tag> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PlatformPrice
                            platform={item.buy_platform_label}
                            cny={item.buy_price_cny}
                            source={item.buy_source_price}
                            currency={item.buy_source_currency}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <PlatformPrice
                            platform={item.sell_platform_label}
                            cny={item.sell_price_cny}
                            source={item.sell_source_price}
                            currency={item.sell_source_currency}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{money(item.sell_net_cny)}</td>
                        <td className="px-4 py-3 text-base font-semibold text-emerald-700">{money(item.profit_cny)}</td>
                        <td className="px-4 py-3 font-medium text-sky-700">{pct(item.margin_pct)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          买 {item.buy_volume}
                          <br />
                          卖 {item.sell_volume}
                        </td>
                      </tr>
                    ))}
                    {!loading && opportunities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          暂无满足条件的套利机会
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-950">账号</h2>
                <div className="flex rounded-md bg-slate-100 p-1 text-sm">
                  <button
                    className={`rounded px-3 py-1 ${authMode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
                    onClick={() => setAuthMode("login")}
                  >
                    登录
                  </button>
                  <button
                    className={`rounded px-3 py-1 ${authMode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
                    onClick={() => setAuthMode("register")}
                  >
                    注册
                  </button>
                </div>
              </div>
              <form className="mt-4 space-y-3" onSubmit={submitAuth}>
                <Input label="用户名" value={username} onChange={setUsername} />
                {authMode === "register" ? <Input label="邮箱" value={email} onChange={setEmail} type="email" /> : null}
                <Input label="密码" value={password} onChange={setPassword} type="password" />
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 font-semibold text-white">
                  {authMode === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {authMode === "register" ? "创建账号" : "登录"}
                </button>
              </form>
              {authMessage ? <p className="mt-3 text-sm text-slate-600">{authMessage}</p> : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-700" />
                <h2 className="text-base font-semibold text-slate-950">订阅套餐</h2>
              </div>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">{plan.name}</div>
                        <div className="text-sm text-slate-500">{plan.duration_days} 天</div>
                      </div>
                      <div className="text-right font-semibold text-slate-950">{money(plan.price_cny)}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                        <Tag key={feature}>{feature}</Tag>
                      ))}
                    </div>
                    <button
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-300 font-medium text-slate-800 hover:bg-slate-50"
                      onClick={() => createOrder(plan.id)}
                    >
                      <CreditCard className="h-4 w-4" />
                      订阅
                    </button>
                  </div>
                ))}
              </div>
              {orderMessage ? <p className="mt-3 text-sm text-slate-600">{orderMessage}</p> : null}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: "emerald" | "sky" | "slate" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-50 text-rose-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className={`mb-3 inline-flex rounded-md p-2 ${tones[tone]}`}>{icon}</div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-emerald-500 focus:bg-white"
        min={min}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-slate-900 focus:bg-white"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PlatformPrice({
  platform,
  cny,
  source,
  currency
}: {
  platform: string;
  cny: string;
  source: string;
  currency: string;
}) {
  return (
    <div>
      <div className="font-medium text-slate-950">{platform}</div>
      <div className="text-slate-700">{money(cny)}</div>
      <div className="text-xs text-slate-500">
        {currency} {Number(source).toFixed(2)}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}
