# cs_backend/tools 提示词

## 模块目标

`tools/` 目录用于放置离线脚本、导数工具、初始化任务和定时作业入口。

## 当前已知脚本职责

- `seed_demo`
  - 生成演示用饰品与价格数据
- `seed_dev_account`
  - 生成最高权限测试账号 `devadmin`
- `calculate_arbitrage_opportunities.py`
  - 根据当前价格表重算套利机会并写入 `arbitrage_opportunity`
- `import_all_item_data.py`
  - 导入平台 itemId 映射数据
- `capture_price_snapshots.py`
  - 将当前价格表采集为历史快照

## 设计要求

- 脚本默认要支持 dry-run 或安全执行方式
- 真正写入数据库时，建议显式使用 `--execute`
- 输出日志要让开发者看得出处理数量、跳过数量、错误数量

## 后续规划

- 真实数据源抓取脚本
- 汇率同步脚本
- 卡价同步脚本
- 定时任务健康检查脚本
- 爬虫失败告警与重试脚本

## 调度建议

- 本地开发可直接运行 management command 或独立脚本
- 生产环境后续可用：
  - 系统计划任务
  - Celery + Redis
  - 容器内 cron

在正式抓取链路接入前，工具层优先围绕“导入、重算、快照、种子数据”保持稳定。
