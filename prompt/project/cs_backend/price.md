# cs_backend/price 提示词

## 模块目标

`price/` 是整个项目的核心业务模块，负责饰品基础信息、平台价格、标准报价抽象、套利机会计算、历史价格快照、市场状态、收藏夹和用户收益记录。

## 已有核心模型

- `Iteminfo`
  - 饰品基础资料，例如中英文名称、品级、分类、图标、收藏集
- `Price`
  - 当前各平台价格与销量源表
- `PriceSnapshot`
  - 30 分钟级别平台价格快照
- `ItemPlatformListing`
  - 各平台 itemId/templateId 映射
- `ArbitrageOpportunity`
  - 预计算后的套利机会结果表
- `OpportunityFavorite`
  - 用户收藏的套利方向
- `TradeRecord`
  - 用户真实成交收益记录

## 当前接口

- `GET /api/price/items/`
- `GET /api/price/items/{id}/`
- `GET /api/price/arbitrage/`
- `GET /api/price/arbitrage-sample/`
- `GET /api/price/opportunities/{id}/`
- `GET /api/price/iteminfo/{iteminfo_id}/history/`
- `GET /api/price/summary/`
- `GET /api/price/status/`
- `GET/POST/PATCH/DELETE /api/price/favorites/`
- `GET/POST/PATCH/DELETE /api/price/trade-records/`

## 价格标准化规则

### 平台分组

- 国内：`buff`、`youpin`、`c5`
- 海外：`waxpeer`、`shadowpay`

### 价格换算

- `BUFF`、`YouPin`、`C5` 默认视为 `CNY`
- `Waxpeer` 原始价格为毫美元表示，需要除以 `1000` 再转 USD
- `ShadowPay` 当前源值按 `USD` 处理
- 海外价格统一乘以 `USD_CNY_RATE` 后转 `CNY`

### 手续费

- 所有卖出手续费从环境变量读取
- 卖出净价公式：
  - `net_price_cny = price_cny * (1 - sell_fee)`

## 套利计算规则

- 默认只看跨组套利
- 买入平台与卖出平台不能相同
- 买入和卖出两边都必须满足 `min_volume`
- 结果过滤参数包括：
  - `q`
  - `category`
  - `quality`
  - `buy_platform`
  - `sell_platform`
  - `min_volume`
  - `min_profit`
  - `min_margin`
  - `cross_group_only`
- 结果必须分页
- 每个 `iteminfo` 默认保留利润最高的一条方向结果用于列表展示

## 报价结构要求

标准报价应至少包含：

- `platform`
- `label`
- `group`
- `price_cny`
- `source_price`
- `source_currency`
- `volume`
- `sell_fee`
- `net_price_cny`
- `last_updated_at`
- `market_url`
- `eligible`
- `is_best_buy`
- `is_best_sell`

## 列表与详情要求

### 套利列表

- 用于订阅用户查看完整分页结果
- 返回最佳机会、利润、利润率、流动性评分、风险标签、报价列表

### 样例榜单

- 对未登录或未订阅用户开放
- 只返回有限数量样例机会，用于展示产品价值

### 单饰品详情

- 返回当前平台报价、买卖方向、历史快照、平台跳转链接等

### 历史快照

- 提供按天数查询历史价格趋势
- 当前采样频率按 30 分钟

## 流动性与风险评分

系统已经具备以下近似能力：

- 按买卖两边最小销量计分
- 按覆盖平台数计分
- 按利润率计分
- 按数据新鲜度计分
- 输出 `liquidity_score` 与 `risk_flags`

若后续要做更准确稳定性评分，应基于 `PriceSnapshot` 继续增强。

## 收藏与收益记录

- 收藏功能帮助用户跟踪某个方向
- 收益记录用于登记真实买卖结果并自动回算 `realized_profit_cny`

## 开发要求

- `price/services.py` 负责价格标准化、利润计算、平台 URL 拼接、评分逻辑
- `price/views.py` 负责分页、筛选、权限与响应结构
- 不要把复杂计算散落在 serializer 或前端里
- 后续接入新平台时，优先扩展标准报价抽象，而不是为每个页面写一套特殊逻辑
