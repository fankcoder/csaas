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
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/price/arbitrage/`
- `GET /api/price/items/`
- `GET /api/pay/plans/`
- `POST /api/pay/orders/`

## 利润机会表

套利结果不写入 `price.profit`，而是写入独立表 `arbitrage_opportunity`。前端使用的 `GET /api/price/arbitrage/` 默认读取这张结果表，避免每次请求都全量动态计算。

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
