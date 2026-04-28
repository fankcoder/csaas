# cs_backend/siteconfig 提示词

## 模块目标

`siteconfig/` 用于维护站点级配置，既支持公开配置下发，也支持管理员在后台维护可配置项。

## 当前能力

- `PublicConfigView`
  - 返回所有 `is_public=True` 的配置项
- `SiteSettingViewSet`
  - 管理员 CRUD 配置项

## 适用场景

- 首页或前端公共文案配置
- 公告、客服链接、渠道地址
- 公开展示的汇率、免责声明、功能开关
- 某些轻量级运营参数

## 设计要求

- 敏感配置不要通过 public config 暴露
- 公开配置结构要适合前端直接消费
- 后续如增加多语言文案、公告栏、A/B 开关，也可继续落在此模块
