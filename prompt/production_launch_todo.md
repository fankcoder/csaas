# 正式上线运营 TODO

更新时间：2026-04-28

目标：把当前 CS2 套利 SaaS 从“可演示/沙盒联调”推进到“可公开注册、可收费、可长期运营”的状态。

## P0 上线前必须完成

- [ ] 创建正式超级管理员账号，确认可以登录后台后，再删除默认 `devadmin` 超级管理员。
- [ ] 清理所有默认测试账号痕迹：README、prompt 文档、演示脚本、种子命令输出、前端文案都不能再公开默认账号和默认密码。
- [ ] 轮换已经暴露过的密钥：PayPal sandbox secret、Steam API key、WAX/SHA API key、数据库密码、Django secret key。
- [ ] 删除或加密保存 `prompt/paypal.md` 里的 PayPal Secret，后续只通过服务器环境变量或密钥管理系统配置。
- [ ] 将线上 Django 配置改为生产模式：`DJANGO_DEBUG=false`。
- [ ] 将 `DJANGO_ALLOWED_HOSTS` 加入正式域名：`floatvia.com`、`www.floatvia.com`，按需保留服务器 IP。
- [ ] 将 `FRONTEND_ORIGINS`、`CSRF_TRUSTED_ORIGINS`、`FRONTEND_BASE_URL`、`BACKEND_BASE_URL` 全部改为正式 HTTPS 域名。
- [ ] 将 Steam OpenID 配置改为正式 HTTPS 域名：`STEAM_OPENID_REALM=https://floatvia.com`，`STEAM_OPENID_RETURN_TO=https://floatvia.com/api/auth/steam/callback/`。
- [ ] 配置 Django 反代安全项：`SECURE_PROXY_SSL_HEADER`、`SESSION_COOKIE_SECURE`、`CSRF_COOKIE_SECURE`、`SECURE_SSL_REDIRECT`，确认 Cloudflare/Nginx 代理头正确。
- [ ] 确认 HSTS 策略，域名和 HTTPS 全部稳定后再开启 `SECURE_HSTS_SECONDS`、`SECURE_HSTS_INCLUDE_SUBDOMAINS`、`SECURE_HSTS_PRELOAD`。
- [ ] 停止使用 `python manage.py runserver` 承载线上后端，改为 Docker + Gunicorn 或 systemd + Gunicorn。
- [ ] 给后端服务配置自动重启、健康检查、日志轮转和启动顺序，避免容器退出后无人发现。
- [ ] 确认 Nginx 路由：`/api/` 转后端，`/admin/` 是否允许公网访问要明确；如果开放后台，至少加 IP 限制、强密码和二次验证。
- [ ] 配置 Django 静态文件发布：`collectstatic`、`STATIC_ROOT`、Nginx `/static/`，否则后台样式可能异常。
- [ ] 统一生产数据库方案，建议 MySQL/MariaDB，不要在正式收费环境使用 SQLite。
- [ ] 创建生产数据库专用用户，不要用 root 账号给应用连接数据库。
- [ ] 确认数据库只监听内网或 `127.0.0.1`，禁止公网暴露 3306。
- [ ] 执行并记录生产迁移流程：`python manage.py migrate`，包含 PayPal 订单字段迁移 `pay.0004_paypal_order_fields`。
- [ ] 建立数据库自动备份，至少覆盖用户、订单、订阅、交易记录、价格数据，并做一次恢复演练。
- [ ] 决定是否把本地数据库数据导入生产库；导入前先备份生产库，导入后核对表数量和关键数据。
- [ ] 修正价格与支付币种关系：当前字段名是 `price_cny`，但 PayPal 默认 `PAYPAL_CURRENCY=USD`；上线前必须确认金额含义，避免 29 CNY 被当成 29 USD 或反过来。
- [ ] PayPal 仍是 sandbox 流程；正式收费前要切换 Live Client ID/Secret，并更新 `PAYPAL_MODE=live`。
- [ ] 增加 PayPal Webhook 验签和异步补偿，处理用户付款后关闭页面、PayPal 延迟通知、重复 capture、退款、争议和拒付。
- [ ] 明确订单过期策略，未支付订单需要自动关闭或定期清理。
- [ ] 关闭生产环境 `mock_paid` 能力，确认 `PAYPAL_ENABLE_MOCK_PAYMENTS=false`。
- [ ] 邮件后端从 console 改成真实 SMTP/邮件服务，用于注册验证码、通知、未来找回密码。
- [ ] 配置邮件域名 SPF、DKIM、DMARC，降低验证码邮件进垃圾箱概率。
- [ ] 给登录、注册、发送验证码、Steam 库存同步、价格查询等接口加限流和滥用防护。
- [ ] 给后台管理员启用强密码策略和 2FA；如果暂时没有 2FA，至少限制后台入口 IP。
- [ ] 移除生产 API 返回的 debug 信息，确认 `EmailCodeView` 不再返回 `debug_code`。
- [ ] 全站跑一次 secret scan，确保 `.env`、密钥、cookie、PayPal Secret 没有进入 Git 或静态资源。

## P1 公开 Beta 前强烈建议完成

- [ ] 为 PayPal 支付流补后端测试：创建订单、capture 成功、金额不匹配、重复 capture、非本人订单、未登录访问。
- [ ] 为订阅权限补测试：免费用户、登录用户、订阅用户、管理员分别能访问哪些接口。
- [ ] 为套利计算补测试：汇率、手续费、平台方向、销量过滤、最小利润、跨组过滤。
- [ ] 为数据导入补测试：饰品基础数据、平台 item id、价格快照、重复导入、异常数据。
- [ ] 为前端关键链路补端到端测试：注册登录、Steam 登录、订阅购买、套利页、收藏、个人中心。
- [ ] 配置 Sentry 或同类错误监控，覆盖后端 500、前端运行时错误和支付异常。
- [ ] 配置服务监控：CPU、内存、磁盘、数据库连接、Nginx 5xx、接口延迟、队列/定时任务状态。
- [ ] 配置业务告警：爬虫失败、价格长时间未更新、套利计算失败、PayPal capture 失败、邮件发送失败。
- [ ] 明确数据更新时间展示，让用户知道价格/套利结果的最近更新时间。
- [ ] 将爬虫、价格快照、套利重算改成可观测的定时任务，记录成功/失败/耗时/处理数量。
- [ ] 确认 BUFF、悠悠有品、Waxpeer、ShadowPay、C5 等平台数据权限和接口合规性。
- [ ] 补齐 Waxpeer、ShadowPay 等平台 item id 映射，避免正式数据覆盖不完整。
- [ ] 增加汇率同步任务，不要长期使用硬编码 `USD_CNY_RATE`。
- [ ] 增加平台手续费配置后台或配置表，避免手续费变化后必须改代码。
- [ ] 梳理免费/付费权益边界：免费 Top N、登录后基础价格、订阅后完整套利、历史走势、收藏、导出、API。
- [ ] 检查所有公开样例接口，避免免费接口泄露完整付费数据。
- [ ] 完成正式版 Terms、Privacy、Disclaimer、Refund Policy，覆盖投资风险、无托管、无收益保证、退款规则。
- [ ] Cookie consent 需要确认是否真的接入 analytics；如果接入，隐私政策要同步。
- [ ] 增加客服/联系入口，用于支付失败、退款、账号问题和数据纠错。
- [ ] 统一品牌域名和页面文案，避免页面仍出现开发、mock、sandbox、test 等正式用户不该看到的字眼。

## P2 正式运营后持续建设

- [ ] 增加管理员运营后台指标：用户数、订阅数、MRR、订单成功率、退款率、活跃用户、API 调用量。
- [ ] 增加订阅生命周期能力：续费提醒、过期提醒、取消订阅、退款记录、发票/收据。
- [ ] 增加支付失败重试和人工补单流程。
- [ ] 增加用户行为分析，关注注册转化、支付转化、套利页留存、搜索关键词。
- [ ] 增加状态页，展示 API、数据更新、支付、Steam 登录等服务状态。
- [ ] 建立发布流程：分支、代码审查、测试、备份、迁移、灰度、回滚步骤。
- [ ] 建立事故预案：数据库恢复、密钥泄露、支付异常、爬虫封禁、Cloudflare/Nginx 故障。
- [ ] 建立定期安全巡检：依赖漏洞、Django/Next.js 升级、密钥轮换、日志审计。
- [ ] 增加多语言内容审核，确保英文、法语、西语、葡语、中文页面含义一致。
- [ ] 增加 SEO 和内容运营计划：FAQ、Blog、Guide、示例数据页、sitemap、robots。
- [ ] 评估国际支付和税务方案：PayPal、Stripe、Paddle、加密货币支付各自的税务、风控和退款责任。
- [ ] 评估国内支付方案：微信/支付宝接入、实名与合规、退款和对账。
- [ ] 明确是否支持“用户充值后代买/代上架”模式；如果支持，需要单独设计资金托管、风控、平台规则和法律责任。

## 建议上线阶段

- [ ] 阶段 1：内部可用。完成生产环境配置、真实数据库、定时数据任务、后台账号、备份、基础监控。
- [ ] 阶段 2：公开 Beta。开放注册、样例套利数据、基础价格查询、错误监控、邮件验证码、用户反馈入口。
- [ ] 阶段 3：沙盒付费演练。PayPal sandbox 全链路跑通，补齐订单、订阅、回调、退款和异常测试。
- [ ] 阶段 4：正式收费。切 PayPal live，完善法律条款、退款政策、告警、客服、备份恢复和发布回滚流程。

## 当前最优先的 10 件事

1. 创建正式管理员并删除 `devadmin`。
2. 将线上 `DEBUG` 关掉，并修好 `floatvia.com` 的 `ALLOWED_HOSTS`。
3. 停止线上 `runserver`，改成 Gunicorn/Docker 或 systemd 服务。
4. 轮换所有已经暴露的密钥，并从 prompt 文件中移除真实 Secret。
5. 明确 PayPal 金额币种，避免 CNY/USD 金额错收。
6. 切换正式邮件服务，确保验证码可达。
7. 为数据库建立自动备份和恢复演练。
8. 给支付、登录、验证码、库存同步加限流。
9. 增加 PayPal Webhook 验签和支付补偿。
10. 补齐支付/订阅/权限/套利计算的核心测试。
