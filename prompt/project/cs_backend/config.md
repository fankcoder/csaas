# cs_backend/config 提示词

## 责任

`config/` 负责 Django 工程级配置，包括设置项、应用注册、数据库连接、缓存、跨域、安全参数和全局 URL。

## 当前结构

- `settings.py`：环境变量加载、数据库配置、Redis 回退、DRF 设置、手续费与汇率配置
- `urls.py`：统一挂载健康检查与业务模块路由
- `wsgi.py` / `asgi.py`：部署入口

## 关键实现规则

### 环境变量

需要优先兼容 `.env`，核心变量包括：

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `FRONTEND_ORIGINS`
- `FRONTEND_BASE_URL`
- `BACKEND_BASE_URL`
- `DATABASE_URL`
- `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD`
- `REDIS_URL`
- `USD_CNY_RATE`
- `BUFF_SELL_FEE`
- `WAXPEER_SELL_FEE`
- `SHADOWPAY_SELL_FEE`
- `YOUPIN_SELL_FEE`
- `C5_SELL_FEE`

### 数据库

- 默认使用 SQLite，方便本地快速启动
- 生产或联调环境允许切换到 MySQL
- 所有模型设计都要兼容 MySQL `utf8mb4`

### 缓存

- 若存在可用 `REDIS_URL` 且 `django_redis` 可用，则启用 Redis
- 否则回退本地缓存，保证开发环境不被阻塞

### DRF

- 认证方式：`TokenAuthentication + SessionAuthentication`
- 默认分页：`PageNumberPagination`
- 默认页大小：`30`

### CORS 与前后端联调

- `FRONTEND_ORIGINS` 用于 `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS` 与前端来源保持一致

## 全局 URL 约定

必须存在：

- `GET /api/health/`
- `api/auth/`
- `api/price/`
- `api/siteconfig/`
- `api/pay/`

## 设计要求

- 配置层不承载业务逻辑
- 所有与平台手续费、汇率相关的默认值必须可通过环境变量覆盖
- 配置应优先支持本地开发成功，其次再扩展生产级部署参数
