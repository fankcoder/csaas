import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "免责声明 | CS2 饰品套利数据分析平台",
  description:
    "CS2 饰品套利数据分析平台免责声明，明确平台只提供数据分析，不保证收益，不托管资产，不自动交易。",
  keywords: ["免责声明", "不保证收益", "不托管资产", "不自动交易", "CS2 饰品套利风险"]
};

export default function DisclaimerPage() {
  return (
    <LegalDocument
      eyebrow="Disclaimer"
      title="免责声明"
      updatedAt="2026-04-28"
      description="本声明用于明确平台信息展示和用户交易决策之间的责任边界。"
      sections={[
        {
          title: "1. 不构成收益承诺",
          body:
            "平台展示的价差、利润率、销量、更新时间和走势图仅为数据分析结果，不代表真实可成交价格，不构成任何收益承诺、投资建议、交易建议或财务建议。"
        },
        {
          title: "2. 不托管资产",
          body:
            "平台不保管用户 Steam 饰品、交易平台资产、现金余额、支付账户或私钥凭证。用户在任何第三方平台上的充值、提现、购买、出售和转移行为均由用户自行完成。"
        },
        {
          title: "3. 不自动交易",
          body:
            "平台不会自动替用户下单、挂单、购买、出售、转移库存或确认 Steam 交易。任何交易执行均需要用户自行登录对应平台并独立判断。"
        },
        {
          title: "4. 数据可能存在误差",
          body:
            "由于第三方平台接口、网页结构、网络延迟、汇率、手续费、库存变化、价格单位、itemId 映射、风控限制或数据源异常，平台数据可能延迟、缺失或不准确。用户应在执行前到对应平台复核。"
        },
        {
          title: "5. 用户自行承担交易风险",
          body:
            "CS2 饰品价格会波动，交易可能受账号限制、平台规则、冷却期、支付通道、提现成本、KYC、地区限制和政策变化影响。用户应自行评估风险并承担全部交易结果。"
        },
        {
          title: "6. 第三方责任",
          body:
            "Steam、Valve、BUFF、悠悠有品、Waxpeer、ShadowPay 等第三方平台的服务中断、规则调整、费用变化、账户限制、资产冻结或数据异常，不由本平台承担责任。"
        },
        {
          title: "7. 内容教育边界",
          body:
            "FAQ、Blog、教程和工具说明用于产品教育和市场知识整理，不保证完整、最新或适合所有用户。涉及平台规则的内容应以第三方平台官方说明为准。"
        }
      ]}
    />
  );
}
