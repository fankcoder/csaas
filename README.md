# CS2 饰品套利数据 SaaS

这是一个前后端分离的 CS2 饰品跨平台套利系统骨架。

- 后端：`cs_backend`，Django + DRF，包含 `price`、`authuser`、`siteconfig`、`pay` app。
- 前端：`cs_web`，Next.js + React + TailwindCSS。
- 核心能力：注册登录、饰品价格查询、跨平台套利计算、套餐与模拟支付订单。

## 后端启动

```powershell
cd cs_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

默认使用 SQLite，便于本地直接运行。要切到 MySQL，在 `cs_backend/.env` 中填写 `MYSQL_HOST`、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`。

主要接口：

- `GET /api/health/`
- `POST /api/auth/email-code/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/price/arbitrage/`
- `GET /api/price/items/`
- `GET /api/pay/plans/`
- `POST /api/pay/orders/`
- `GET /api/pay/subscription/`
- `GET /api/auth/me/`
- `POST /api/auth/steam/bind/`
- `GET /api/auth/steam/inventory/`

开发测试账号：

```powershell
python manage.py seed_dev_account
```

默认账号 `devadmin`，默认密码 `DevAdmin12345`。该账号是 staff/superuser，拥有最高级权限。

## 权限策略

- 公开：官网、套餐、注册、登录、发送邮箱验证码、市场概览。
- 登录用户：个人中心、Steam ID 绑定、Steam 库存查询、基础饰品数据查询。
- 订阅用户或管理员：套利利润分页查询、单饰品套利详情等高级功能。

套利分页参数：

```text
GET /api/price/arbitrage/?page=1&page_size=30&q=AK&min_volume=1
```

返回 DRF 标准分页字段：`count`、`next`、`previous`、`results`。

利润结果口径：

- 方向 A 固定表示采购方向，方向值为国内市场或海外市场。
- 方向 B 固定表示出售方向，方向值为另一侧市场组。
- `buy_quotes` 返回方向 A 市场组内多平台采购价，并用 `is_best_buy` 标记最低可计算采购价。
- `sell_quotes` 返回方向 B 市场组内多平台出售净价，并用 `is_best_sell` 标记最高可计算出售净价。
- `profit_cny = 最高出售净价 - 最低采购价`。

## 利润机会表

套利结果写入独立表 `arbitrage_opportunity`。前端使用的 `GET /api/price/arbitrage/` 默认读取这张结果表，避免每次请求都全量动态计算。

重新计算利润机会：

```powershell
cd cs_backend
python tools\calculate_arbitrage_opportunities.py
python tools\calculate_arbitrage_opportunities.py --execute
```

常用参数：

```powershell
python tools\calculate_arbitrage_opportunities.py --execute --min-volume 5 --min-profit 10
```

套利计算规则：

- `wax_price` 按 `27472.00 -> 27.472 USD` 处理，即除以 `1000`。
- Waxpeer 出售手续费默认 `7%`。
- BUFF 出售手续费默认 `2.5%`。
- ShadowPay 手续费暂按 `5%`，已记录在 `prompt/qa.md` 待确认。
- 默认只计算国内平台与海外平台之间的跨组套利。
- 买入和卖出平台的销量都必须达到 `min_volume`，避免无销量机会进入利润榜。

## 前端启动

```powershell
cd cs_web
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

打开 `http://localhost:3000`。

## Demo 数据

后端执行 `python manage.py seed_demo` 会创建演示用 `iteminfo` 和 `price` 表，并插入几条带利润差的饰品数据。接入真实数据源后，可以保留现有模型与套利 API，只替换采集和入库逻辑。

## 平台 ItemId 映射导入

`cs_backend/tools/all_item_data.json` 是本地数据文件，已加入 `.gitignore`，不要提交到 Git。

导入全饰品平台 itemId 映射：

```powershell
cd cs_backend
python tools\import_all_item_data.py
python tools\import_all_item_data.py --execute --replace
```

脚本会流式解析 JSON 中的 `data` 数组，写入：

- `iteminfo`：按 `marketHashName` 关联或补充饰品基础信息
- `item_platform_listing`：保存 `BUFF`、`YOUPIN`、`C5`、`HALOSKINS` 等平台 itemId

## 价格快照与走势

单饰品详情页使用 `price_snapshot` 表展示不同平台价格走势。日常建议每 30 分钟执行一次快照采集：

```powershell
cd cs_backend
python tools\capture_price_snapshots.py --execute
```

脚本会把当前 `price` 表中各平台报价按半小时桶写入快照表；重复执行同一个半小时桶会被唯一约束去重。
