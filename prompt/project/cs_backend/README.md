# cs_backend 提示词

## 模块定位

`cs_backend/` 是项目的后端主工程，负责提供 REST API、权限校验、数据模型、套利计算、用户账户、订阅能力和站点配置。

技术栈：

- `Django`
- `Django REST Framework`
- `django-filter`
- `TokenAuthentication`

## 目录映射

```text
cs_backend/
  config/       Django 项目配置
  authuser/     用户、邮箱验证码、Steam 绑定、清单
  price/        饰品、价格、套利、快照、收藏、收益记录
  pay/          套餐、订单、订阅、权限依赖
  siteconfig/   公共站点配置与后台配置项
  tools/        数据导入、快照、套利重算脚本
```

## 后端总目标

- 为前端提供稳定、可分页、可鉴权、可扩展的 JSON API
- 把不同平台的价格数据统一抽象成标准报价结构
- 输出“真实可执行”的套利结果，而不是只展示表面价差
- 支撑免费、登录、订阅三层权限体系

## 全局规范

- API 前缀统一挂在 `/api/`
- 公共接口使用 `AllowAny`
- 账户相关接口使用 `IsAuthenticated`
- 高级套利接口使用订阅权限类，例如 `HasActiveSubscription`
- 列表接口默认支持分页，优先使用 DRF 自带分页结构
- 重要筛选参数统一通过 querystring 传递，例如 `q`、`page`、`page_size`、`min_volume`
- 任何未确认需求都记录在 `prompt/qa.md`

## 子模块拆分

- `config.md`：项目配置、环境变量、URL 总路由、跨域、数据库与缓存
- `authuser.md`：注册登录、邮箱验证码、Steam、个人中心前置能力
- `price.md`：价格模型、套利逻辑、样例榜单、快照与收藏收益
- `pay.md`：套餐、订单、订阅、权限激活与模拟支付
- `siteconfig.md`：公开配置与后台配置项
- `tools.md`：种子数据、快照采集、套利重算、映射导入

## 设计原则

- 先保证接口可运行，再继续做复杂扩展
- 抽象优先围绕业务语义，而不是围绕单个平台临时字段
- 涉及价格、利润、手续费、汇率时，统一用后端做可信计算
- 返回结构尽量稳定，便于前端分页列表、详情页和图表直接消费
