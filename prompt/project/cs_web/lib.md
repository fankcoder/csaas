# cs_web/src/lib 提示词

## 模块目标

`src/lib/` 负责前端侧的基础能力封装，包括 API 调用、认证信息管理、格式化工具和内容数据源。

## 当前能力拆分

- `api.ts`
  - 统一封装 `apiFetch`
  - 自动拼接 `NEXT_PUBLIC_API_BASE_URL`
  - 支持 token 注入
  - 默认 `cache: "no-store"`
  - 统一处理 JSON/文本错误响应
- `auth.ts`
  - 管理 token、本地用户信息和登录态读取
- `blog.ts`
  - Blog 页面内容源、文章元数据
- `format.ts`
  - 页面展示用格式化辅助

## 设计要求

- 所有前后端请求优先走统一 API 封装
- 不要在页面里重复手写 Authorization Header
- 错误提示要尽量保留后端原始 `detail`
- 可复用的数据类型应收敛在 lib 或邻近模块中维护

## 认证要求

- 前端登录态基于后端 token
- 登录成功后要本地持久化 token 与用户信息
- 需要登录的页面加载时，要先检查本地 token，再决定拉取数据或引导登录

## 内容要求

- Blog 与 FAQ 内容应服务 SEO 和用户教育
- 如果后续把内容迁到 CMS 或后端接口，前端 lib 仍应保留清晰的数据适配层
