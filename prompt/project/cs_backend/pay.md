# cs_backend/pay 提示词

## 模块目标

`pay/` 负责套餐、订单、订阅与高级权限的激活，是整个 SaaS 商业化闭环的基础模块。

## 已有模型

- `Plan`
  - 套餐编码、名称、价格、时长、功能列表、排序、是否启用
- `Order`
  - 订单、支付状态、支付渠道、外部订单号、支付时间
- `Subscription`
  - 用户订阅状态、起止时间、关联订单

## 已有接口

- `GET /api/pay/plans/`
- `GET /api/pay/plans/{id}/`
- `GET /api/pay/orders/`
- `POST /api/pay/orders/`
- `GET /api/pay/orders/{id}/`
- `POST /api/pay/orders/{id}/mock_paid/`
- `GET /api/pay/subscription/`

## 当前业务状态

- 当前支付流程以模拟支付为主
- 套餐可被公开访问
- 订单与订阅只对登录用户开放
- 订阅激活后，应自动解锁高级功能

## 权限设计

- 免费用户：浏览官网、FAQ、Blog、公开样例榜单、公开市场概览
- 登录用户：个人中心、Steam、Checklist、基础页面
- 订阅用户：完整套利列表、单饰品高级详情、收藏、收益分析等
- `staff/superuser` 视为拥有高级权限

## 支付实现要求

- 当前允许 `mock` 渠道，便于本地测试
- 非开发环境下，模拟支付应限制为管理员使用
- 后续可扩展：
  - 海外信用卡
  - Paddle / Stripe
  - 数字货币支付

## 设计原则

- `Plan.features` 应保持前后端都容易消费的 JSON 结构
- 订单创建时要固化金额，避免套餐改价影响历史订单
- 订阅状态必须可独立查询，方便前端做导航守卫与页面控制
- 高级权限不要散落在各模块硬编码，应尽量通过统一权限类复用
