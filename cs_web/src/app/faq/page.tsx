import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | CS2 饰品套利数据分析平台",
  description:
    "CS2 饰品套利平台常见问题，覆盖数据来源、利润计算、销量过滤、订阅支付、用户协议、隐私政策和风险免责声明。",
  keywords: ["CS2 饰品套利 FAQ", "套利风险", "不保证收益", "不自动交易", "BUFF Waxpeer"]
};

const faqGroups = [
  {
    title: "数据与利润计算",
    items: [
      {
        question: "平台利润是怎么计算的？",
        answer:
          "系统先把不同平台报价统一到 CNY，再按方向 A 的最低有效采购价和方向 B 的出售净价计算利润。Waxpeer 使用美元报价并做汇率换算，出售侧会扣除平台手续费。"
      },
      {
        question: "为什么同一个饰品会出现多个利润？",
        answer:
          "方向 A 固定取当前筛选范围内的最低采购价，方向 B 会对每个可出售平台分别计算利润。默认列表展示最高利润，也可以筛选某个具体出售平台。"
      },
      {
        question: "销量低的机会为什么会被过滤？",
        answer:
          "套利不是只看价差，还要看能否卖出。BUFF 使用 buff_sell_num，Waxpeer 使用 wax_count，销量低于阈值的平台不会作为有效交易方向。"
      },
      {
        question: "最后更新时间有什么用？",
        answer:
          "价格越旧，机会失效概率越高。利润查询页的每个平台报价都会显示最后更新时间，鼠标移到数据上也会立刻显示详细时间。"
      }
    ]
  },
  {
    title: "平台与账号准备",
    items: [
      {
        question: "需要准备哪些交易平台账号？",
        answer:
          "建议至少准备 Steam、BUFF、悠悠有品、Waxpeer、ShadowPay 账号，并完成各平台要求的身份、支付、API 或交易链接配置。"
      },
      {
        question: "为什么需要 Steam 账号准备？",
        answer:
          "饰品交易依赖 Steam 库存、交易报价和市场限制。新设备登录、令牌、交易暂挂、库存隐私都可能影响执行效率。"
      },
      {
        question: "系统会自动替我交易吗？",
        answer:
          "不会。当前平台定位为数据分析和机会发现，不托管资产，也不自动下单。用户需要在对应市场自行判断并执行交易。"
      }
    ]
  },
  {
    title: "订阅、支付与风险",
    items: [
      {
        question: "订阅后能看到什么？",
        answer:
          "订阅用户可以查看完整利润榜、搜索筛选、方向 B 平台利润、销量过滤后的机会，以及后续扩展的提醒、收藏和报告能力。"
      },
      {
        question: "套利一定赚钱吗？",
        answer:
          "不保证。价差会受到库存锁定、手续费、汇率、价格波动、提现成本和成交速度影响。系统提供数据依据，最终交易风险由用户自行承担。"
      },
      {
        question: "平台是否托管我的饰品或资金？",
        answer:
          "不托管。平台不接收用户饰品、现金余额、支付账户或私钥凭证，也不控制任何第三方平台账户。"
      },
      {
        question: "用户协议、隐私政策和免责声明在哪里？",
        answer:
          "页面底部提供用户协议、隐私政策和免责声明入口。正式运营前，应根据目标地区、支付方式和实际数据处理方式再做合规审查。"
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="eyebrow">FAQ</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              CS2 饰品套利常见问题
            </h1>
            <p className="mt-3 muted-copy">
              这里集中说明平台数据、利润计算、账号准备、订阅支付和风险边界，方便新用户快速判断这个工具是否适合自己。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        {faqGroups.map((group) => (
          <div key={group.title} className="data-card">
            <h2 className="text-lg font-semibold text-slate-950">{group.title}</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {group.items.map((item) => (
                <details key={item.question} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="cursor-pointer list-none font-medium text-slate-900">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {item.question}
                      <span className="text-sm text-blue-700 group-open:hidden">展开</span>
                      <span className="hidden text-sm text-blue-700 group-open:inline">收起</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
