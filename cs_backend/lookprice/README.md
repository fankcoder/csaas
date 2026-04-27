# lookprice 数据采集说明

当前保留并整理的主入口：

```powershell
cd cs_backend
python lookprice\fetch_platforms.py
python lookprice\fetch_platforms.py buff uu waxpeer shadow
python lookprice\fetch_platforms.py waxper shadowpay -j 2
```

已接入 Django ORM 的平台：

- `buff`：写入 `price.buff_*`、`price.steam_*`，BUFF itemId 写入 `item_platform_listing`
- `uu` / `youpin`：写入 `price.uu_price`、`price.uu_time`，悠悠有品 itemId 写入 `item_platform_listing`
- `waxpeer`：写入 `price.wax_price`、`price.wax_count`、`price.wax_time`
- `shadow` / `shadowpay`：写入 `price.shadow_price`、`price.shadow_sell_num`、`price.shadow_time`

认证信息由 `platform_auth.py` 读取，避免和 Django 项目的 `config.settings` 命名冲突。读取顺序：

- BUFF：`lookprice/cookie.json` 的 `buff.cookie`，或环境变量 `BUFF_COOKIE`
- 悠悠有品：`lookprice/cookie.json` 的 `uu.cookie`，或环境变量 `YOUPIN_TOKEN` / `UU_TOKEN`
- ShadowPay：`lookprice/cookie.json` 的 `shadow.cookie` / `shadowpay.cookie`，或环境变量 `SHADOWPAY_TOKEN`

`lookprice/cookie.json` 包含本地登录凭证，已加入 `.gitignore`，不要提交。

暂未整理的平台脚本如 C5、IGXE、DMarket 先保留，后续确认接口可用后再按同样方式接入 Django ORM。
