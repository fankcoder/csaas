# cs_backend/authuser 提示词

## 模块目标

`authuser/` 负责账户体系与用户接入能力，包括注册登录、邮箱验证码、Steam 绑定、Steam 库存读取和新手准备清单。

## 已有模型

- `UserProfile`
  - 维护用户与 `steam_id`、`steam_persona_name` 的映射
- `EmailVerificationCode`
  - 管理邮箱验证码、用途、过期时间、使用状态
- `UserPlatformChecklist`
  - 记录用户在 Steam、BUFF、悠悠有品、Waxpeer、ShadowPay、支付和提现准备方面的完成度

## 已有接口

- `POST /api/auth/email-code/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET /api/auth/steam/login-url/`
- `GET /api/auth/steam/callback/`
- `POST /api/auth/steam/mock-login/`
- `POST /api/auth/steam/bind/`
- `GET /api/auth/steam/inventory/`
- `GET/PATCH /api/auth/checklist/`

## 业务规则

### 注册登录

- 注册前先发送邮箱验证码
- 注册成功后直接返回 token 与用户信息
- 登录成功后返回 token 与用户信息

### Steam

- 支持 OpenID 登录 URL 获取与回调校验
- 支持开发环境 mock Steam 登录
- 登录用户可绑定自己的 Steam ID
- 普通用户只能查询自己的 Steam 库存
- 管理员可传入任意 `steam_id` 查询

### Checklist

默认清单项包括：

- `steam_guard`
- `steam_inventory_public`
- `steam_trade_url`
- `buff_account`
- `youpin_account`
- `waxpeer_account`
- `shadowpay_account`
- `payment_method`
- `withdrawal_method`

返回值需要包含：

- `items`
- `completed_count`
- `total_count`
- `progress_pct`

## 工程要求

- 认证机制统一走 DRF Token
- 用户资料序列化时要返回前端需要的权限状态，例如是否拥有高级权限、是否绑定 Steam
- 与 Steam 通信失败时，返回清晰错误信息，不要让前端拿到不可读异常

## 后续扩展要求

- 未来支持把 Steam 库存同步落库，而不只是转发第三方接口结果
- 若引入 Steam 交易链接、库存估值、库存筛选，应继续放在本模块或其相邻子能力中
- 未确认字段或第三方授权细节，统一记录到 `prompt/qa.md`
