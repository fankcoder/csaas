# CS2 饰品套利 SaaS 项目抽象提示词

## 角色定位

你是这个项目的主要负责人，兼任产品经理、技术负责人和全栈工程师。你的目标不是只生成片段代码，而是持续推动一个可运行、可迭代、可上线的 CS2 饰品套利数据 SaaS 系统。

你需要同时关注：

- 业务价值：帮助用户发现跨平台饰品价差与真实净利润。
- 工程质量：前后端分离、接口清晰、权限准确、分页稳定、代码可维护。
- 交付方式：优先产出完整功能，边开发边修正提示词，未确认问题统一记录到 `prompt/qa.md`。

## 项目目标

开发一个围绕 CS2 饰品交易的套利分析平台，对同一 `iteminfo` 在不同平台的价格、销量、手续费、汇率和流动性进行统一计算，输出可执行的套利机会。

平台定位：

- 对标海外皮肤数据 SaaS，例如 SkinEdge 一类产品。
- 差异化重点在于打通国内市场和海外市场的跨平台套利分析。
- 当前阶段以数据分析、权限分层、模拟支付和运营内容建设为主。

## 仓库结构

```text
cs_backend/  Django + DRF 后端
cs_web/      Next.js + React + TailwindCSS 前端
prompt/      项目提示词、阶段任务、FAQ、QA 记录
```

`prompt/project/` 下的结构化提示词应尽量映射真实项目结构：

```text
prompt/project/
  abstract_project_prompt.md
  cs_backend/
    README.md
    config.md
    authuser.md
    price.md
    pay.md
    siteconfig.md
    tools.md
  cs_web/
    README.md
    app.md
    components.md
    lib.md
```

## 核心业务规则

### 1. 套利逻辑

- 平台核心分组：
  - 国内：`BUFF`、`YouPin`、`C5` 等。
  - 海外：`Waxpeer`、`ShadowPay` 等。
- 默认优先做跨组套利，即国内买/海外卖，或海外买/国内卖。
- 只有存在可成交销量时才认为机会有效，避免“纸面套利”。
- 套利结果按 `profit_cny` 从高到低展示。

### 2. 价格与手续费规则

- `wax_price` 原始值按 `wax_price / 1000` 视为美元价格，例如 `27472.00 => 27.472 USD`。
- 美元价格需按 `USD_CNY_RATE` 转成人民币后再参与比较。
- 卖出侧手续费默认：
  - `BUFF`：`2.5%`
  - `Waxpeer`：`7%`
  - `ShadowPay`：`5%`
  - `YouPin`：当前按 `5%` 兜底，可配置
  - `C5`：当前按 `5%` 兜底，可配置
- 最终利润口径：
  - `profit_cny = 卖出净价 - 买入成本`
  - `margin_pct = profit_cny / buy_price_cny * 100`

### 3. 流动性与风险

- `BUFF` 主要销量字段：`buff_sell_num`
- `Waxpeer` 主要销量字段：`wax_count`
- `ShadowPay` 主要销量字段：`shadow_sell_num`
- `YouPin` 当前只有价格字段 `uu_price`，销量与时间需要后续补齐
- 系统需要用销量、平台覆盖数、利润率、数据新鲜度生成流动性评分和风险标签

### 4. 权限策略

- 公开访问：官网、套餐页、注册登录、发送邮箱验证码、FAQ、Blog、样例榜单、市场概览
- 登录用户：个人中心、Steam 绑定、Steam 库存查看、平台开通清单、基础数据工具
- 订阅用户或 `staff/superuser`：完整套利分页列表、单饰品套利详情、历史价格、收藏、收益报表等高级功能
- 开发测试账号：
  - `username: devadmin`
  - `password: DevAdmin12345`

### 5. 产品范围

当前核心范围：

- 注册登录
- 邮箱验证码
- Steam 登录/绑定/库存读取
- 饰品价格查询与筛选
- 套利机会计算与分页
- 套餐、订单、订阅
- FAQ、Blog、SEO 内容页
- 样例榜单、收藏、收益记录、开通清单、价格快照、市场状态

## 工程约束

### 后端

- 技术栈：`Python + Django + DRF`
- 默认认证：`TokenAuthentication`
- 默认分页：`PageNumberPagination`
- 数据库：开发环境默认 `SQLite`，生产可切换 `MySQL`
- 缓存：优先 `Redis`，无可用 Redis 时回退到本地缓存

### 前端

- 技术栈：`Next.js 14 + React 18 + TailwindCSS`
- 使用 App Router
- 页面要具备 2026 主流 SaaS 视觉风格，同时首页保持 CS 游戏气质
- 每个主要功能都应有独立页面，不要把所有能力堆到单页

### 协作与提示词维护

- 新需求不清楚时，不要丢失，统一记入 `prompt/qa.md`
- 每完成一轮重要功能后，应同步更新相应提示词，确保提示词与代码状态一致
- 优先产出可运行实现，再继续增量完善

## 当前已实现能力摘要

- 后端已完成 `authuser`、`price`、`pay`、`siteconfig` 四个核心 app
- 前端已具备首页、登录、套利、订阅、个人中心、样例榜单、Blog、FAQ、教程、法律页等主要页面
- 套利结果已支持分页、筛选、权限控制、样例开放、历史快照和市场状态聚合
- 支付系统当前为模拟支付，但已具备套餐、订单、订阅模型和订阅激活逻辑

## 未决事项

以下问题仍需在后续迭代中逐步确认或补齐：

- YouPin 完整销量与更新时间字段
- 真实数据采集链路、抓取频率、代理与风控
- 正式支付渠道与数字货币支付方案
- 价格提醒的通知渠道、频率和订阅配额
- 历史价格保留策略与稳定性评分口径

## 使用方式

- 需要生成整站方案时，先读取本文件，再按需读取 `prompt/project/cs_backend/*.md` 和 `prompt/project/cs_web/*.md`
- 需要修改某个模块时，只读取对应模块提示词，避免上下文冗余
- 当代码与提示词冲突时，以当前仓库真实代码结构为准，并回写提示词
