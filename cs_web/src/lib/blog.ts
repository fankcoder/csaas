export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  updatedAt: string;
  keywords: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  references?: Array<{
    label: string;
    href: string;
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "steam-account-setup",
    title: "Steam 账号准备：令牌、库存公开和交易链接",
    description:
      "开始做 CS2 饰品价差分析前，先确认 Steam Guard、库存隐私、交易链接和账号限制，避免执行机会时被交易限制卡住。",
    tag: "新手教程",
    updatedAt: "2026-04-28",
    keywords: ["Steam 账号准备", "CS2 饰品交易", "Steam 交易链接", "Steam Guard"],
    sections: [
      {
        heading: "先检查 Steam Guard",
        body:
          "饰品交易依赖 Steam 账号安全状态。新设备登录、关闭或重置 Steam Guard、修改密码、账号恢复等操作，都可能触发交易或市场限制。做价差分析前，先确认账号可以正常发起和确认交易。"
      },
      {
        heading: "库存公开与交易链接",
        body:
          "第三方交易平台通常需要读取库存或发送报价。库存隐私、交易链接、API Key 和平台授权状态不正确时，会导致看得到价差但无法执行。交易链接建议单独保存，并在发现异常授权后及时重置。"
      },
      {
        heading: "把账号状态写进执行清单",
        body:
          "套利不是只看价格。账号是否受限、库存是否可交易、资金是否可用、平台提现是否正常，都应该在执行前检查。系统提供数据分析，不托管资产，也不会替用户自动交易。"
      }
    ],
    references: [
      {
        label: "Steam Subscriber Agreement",
        href: "https://store.steampowered.com/subscriber_agreement/"
      }
    ]
  },
  {
    slug: "buff-guide",
    title: "BUFF 教程：如何看懂 CS2 饰品价格、销量和手续费",
    description:
      "面向新手的 BUFF 饰品市场使用教程，重点说明售价、销量、可交易状态、手续费和价差判断方式。",
    tag: "平台教程",
    updatedAt: "2026-04-28",
    keywords: ["BUFF 教程", "BUFF 饰品价格", "BUFF 手续费", "CS2 BUFF"],
    sections: [
      {
        heading: "关注最低可买价格，不只看展示价格",
        body:
          "做采购方向判断时，应优先看当前可买入的最低有效价格。异常低价、库存锁定、不可交易状态和页面延迟都可能导致价格不可执行，需要结合更新时间和平台跳转链接复核。"
      },
      {
        heading: "销量字段决定机会质量",
        body:
          "在本系统中，BUFF 的可用销量主要来自 buff_sell_num。销量过低意味着买入后不一定能卖出，即使价差很大，也可能只是不可执行机会。筛选时建议设置最低销量阈值。"
      },
      {
        heading: "手续费会改变真实利润",
        body:
          "BUFF 出售侧默认按 2.5% 手续费估算。利润应使用出售净价减去采购价，而不是直接用两个平台的标价相减。实际手续费、提现成本和平台规则变化应以平台页面为准。"
      }
    ]
  },
  {
    slug: "waxpeer-guide",
    title: "Waxpeer 教程：美元报价、Waxpeer 手续费和 CNY 换算",
    description:
      "解释 Waxpeer 的美元价格换算、系统中的 wax_price 处理方式、7% 出售手续费和跨币种利润计算逻辑。",
    tag: "平台教程",
    updatedAt: "2026-04-28",
    keywords: ["Waxpeer 教程", "Waxpeer 手续费", "Waxpeer 美元报价", "CS2 Waxpeer"],
    sections: [
      {
        heading: "先把价格单位统一",
        body:
          "Waxpeer 原始价格在当前数据表里按特殊单位存储，例如 27472.00 需要先换算为约 27.47 美元，再按 USD/CNY 汇率折算成人民币。跨平台比较必须统一币种。"
      },
      {
        heading: "出售侧要扣 Waxpeer 手续费",
        body:
          "系统默认 Waxpeer 出售手续费为 7%。如果把 Waxpeer 作为方向 B 出售平台，页面展示的净价会扣除手续费后再计算利润。若平台规则变更，需要同步更新系统配置。"
      },
      {
        heading: "汇率和提现成本是额外风险",
        body:
          "海外平台利润会受到汇率、充值提现、支付通道和资金到账时间影响。系统中的利润是数据分析结果，不代表最终入账金额，也不构成收益承诺。"
      }
    ]
  },
  {
    slug: "buff-waxpeer-shadowpay-profit",
    title: "BUFF、Waxpeer、ShadowPay 价差为什么要分别计算",
    description:
      "同一饰品在不同出售平台的手续费、销量和成交速度不同，方向 B 每个平台都应该独立计算利润。",
    tag: "利润计算",
    updatedAt: "2026-04-28",
    keywords: ["BUFF Waxpeer 价差", "ShadowPay 手续费", "CS2 饰品套利", "方向 B 利润"],
    sections: [
      {
        heading: "方向 A 选择最低有效采购价",
        body:
          "方向 A 的核心是找到当前筛选范围内的最低有效采购价。这个价格必须有销量支撑，并且不能来自明显过期或不可执行的数据。"
      },
      {
        heading: "方向 B 每个平台单独算净价",
        body:
          "方向 B 不能只看最高标价。系统会分别计算 BUFF、悠悠有品、Waxpeer、ShadowPay 等平台的出售净价，并按用户筛选的平台展示对应利润。"
      },
      {
        heading: "默认展示最高利润，但保留平台筛选",
        body:
          "默认列表展示每个饰品当前最高利润机会。用户也可以指定方向 B 某个平台，查看如果只在该平台出售时，哪些饰品仍然有价差空间。"
      }
    ]
  },
  {
    slug: "steam-trade-restrictions",
    title: "Steam 交易限制：交易暂挂、市场限制和 7 天冷却",
    description:
      "整理 Steam 饰品交易中常见的账号限制、交易暂挂、市场购买冷却和安全检查，避免把不可执行价格当成机会。",
    tag: "风险控制",
    updatedAt: "2026-04-28",
    keywords: ["Steam 交易限制", "Steam 交易暂挂", "Steam 市场限制", "CS2 7 天冷却"],
    sections: [
      {
        heading: "为什么交易限制会影响套利",
        body:
          "CS2 饰品机会有时间窗口。账号进入交易暂挂、市场限制或安全审核时，即使页面上看到利润，也可能无法及时买入、转移或卖出。执行前应先确认账号状态。"
      },
      {
        heading: "市场购买后的冷却要纳入资金周期",
        body:
          "部分通过 Steam 市场或第三方平台流转的饰品可能存在可交易冷却。冷却期会延长资金占用时间，并放大价格波动风险。系统展示价差，不代表可以立即完成闭环。"
      },
      {
        heading: "规则以 Steam 官方页面为准",
        body:
          "Steam 的账号安全、市场和交易规则可能调整。本文只做运营教育，执行前应以 Steam 官方页面、交易确认页和平台提示为准。"
      }
    ],
    references: [
      {
        label: "Steam Security and Trading Update",
        href: "https://store.steampowered.com/news/20631/"
      },
      {
        label: "Steam Subscriber Agreement",
        href: "https://store.steampowered.com/subscriber_agreement/"
      }
    ]
  },
  {
    slug: "fee-calculation",
    title: "CS2 饰品手续费计算：标价、净价、汇率和真实利润",
    description:
      "用公式拆解 CS2 饰品跨平台价差，说明采购价、出售手续费、美元换算、提现成本和利润率的关系。",
    tag: "利润计算",
    updatedAt: "2026-04-28",
    keywords: ["CS2 手续费计算", "饰品利润公式", "Waxpeer 汇率", "BUFF 手续费"],
    sections: [
      {
        heading: "基础公式",
        body:
          "出售净价 = 出售标价 × (1 - 出售手续费率)。利润 = 出售净价 - 采购价。利润率 = 利润 ÷ 采购价 × 100%。系统中的利润查询页按这个逻辑展示方向 B 每个平台的净利润。"
      },
      {
        heading: "美元平台先换算成人民币",
        body:
          "Waxpeer、ShadowPay 等海外平台通常以美元计价。系统会先把源价格换算成 USD，再按配置汇率折算 CNY，最后扣除平台手续费。汇率波动会影响最终结果。"
      },
      {
        heading: "别忽略提现和时间成本",
        body:
          "平台提现、充值折损、支付通道费、冷却期和卖出等待时间，都会影响真实利润。系统适合用于筛选机会，不能替代最终下单前的人工复核。"
      }
    ]
  },
  {
    slug: "liquidity-risk-filter",
    title: "用销量和流动性评分过滤不可执行机会",
    description:
      "高价差不一定代表高质量机会。销量、更新时间、平台覆盖和异常利润率都需要纳入判断。",
    tag: "流动性",
    updatedAt: "2026-04-28",
    keywords: ["CS2 饰品销量", "套利风险", "流动性评分", "低销量过滤"],
    sections: [
      {
        heading: "销量阈值",
        body:
          "BUFF 使用 buff_sell_num，Waxpeer 使用 wax_count。低于阈值的平台不会作为有效套利方向，避免把无人接盘的报价放进利润榜。"
      },
      {
        heading: "数据新鲜度",
        body:
          "价格更新时间越久，机会失效概率越高。利润查询页已经展示各平台最后更新时间，鼠标移到报价上可快速查看数据来源的新鲜度。"
      },
      {
        heading: "异常利润率要复核",
        body:
          "极端利润率可能来自平台 itemId 映射错误、价格源异常、库存不可交易或汇率配置问题。高利润机会应优先人工复核。"
      }
    ]
  },
  {
    slug: "arbitrage-risk",
    title: "CS2 饰品套利风险：价格波动、账号限制和平台规则",
    description:
      "系统只提供数据分析，不保证收益。本文整理 CS2 饰品套利前需要理解的主要风险边界。",
    tag: "风险控制",
    updatedAt: "2026-04-28",
    keywords: ["CS2 饰品套利风险", "饰品价格波动", "不保证收益", "第三方交易平台风险"],
    sections: [
      {
        heading: "价格波动风险",
        body:
          "饰品价格会受市场热度、库存深度、活动、版本更新、供需和平台延迟影响。采集时存在利润，不代表执行完成时仍然存在利润。"
      },
      {
        heading: "账号与平台风险",
        body:
          "Steam 和第三方平台可能因账号安全、KYC、地区、支付、反欺诈或规则变更限制交易。用户必须自行确认平台规则并承担账号操作风险。"
      },
      {
        heading: "系统的边界",
        body:
          "本平台只提供价格聚合、数据分析和机会排序，不托管用户资产，不代用户下单，不自动交易，也不承诺任何收益。"
      }
    ],
    references: [
      {
        label: "Steam Subscriber Agreement",
        href: "https://store.steampowered.com/subscriber_agreement/"
      }
    ]
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
