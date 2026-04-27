我想开发一套cs2游戏饰品皮肤套利的数据saas系统，你是这个项目的主要负责人兼产品经理,

项目分为前端后端, 前后端分离结构，通过api来交互。
项目的核心卖点：比较相同iteminfo在不同平台的不同价格，价格差越大说明套利空间越大，但是也要注意一个问题就是销量buff平台是buff_sell_num 字段，而waxpeer是wax_count 字段，销量过低可能卖不出去也就是不存在套利空间.
另外需要注意，wax_price的价格是美元并且27472.00其实是27.47美元，然后wax平台出售收取7%的手续费，
而buff平台出售收取2.5%的手续费，然后你考虑不同的平台采购出售的套利空间，主要是这在两类国内buff.163.com，www.youpin898.com和国外waxpeer.com,shadowpay.com，这两类中尝试获取套利空间。

将可套利的iteminfo从利润大到小告诉我（排除没有销量的iteminfo）

你要根据生成的代码不停的调整提示词，来达到最终的，要尽可能的生成能完整功能并且可运行的代码。

前端代码写在目录：cs_web\
后端代码写在目录：cs_backend\

如果有需求不清楚的将问题全部保存在prompt\qa.md下面。


前端代码框架：react, nextjs, tailwindcss
后端代码框架: python, django, drf, mysql, redis

数据源从各个饰品皮肤交易站获取：waxpeer.com,shadowpay.com,buff.163.com,www.youpin898.com 等可拓展

saas的核心功能：
注册登录
饰品数据的查询筛选
套利计算系统
支付系统

django的核心app price, authuser, siteconfig，pay


price模型的样例model:

```
class Iteminfo(models.Model):
    appid = models.CharField(max_length=8, blank=True, null=True)
    name = models.CharField(max_length=128, blank=True, null=True)
    market_hash_name = models.CharField(max_length=128)
    market_name_cn = models.CharField(max_length=128, blank=True, null=True)
    icon_url = models.CharField(max_length=512, blank=True, null=True)
    quality = models.CharField(max_length=64, blank=True, null=True)
    quality_color = models.CharField(max_length=32, blank=True, null=True)
    collection = models.CharField(max_length=64, blank=True, null=True)
    collection_url = models.CharField(max_length=512, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'iteminfo'



class Price(models.Model):
    iteminfo = models.OneToOneField(Iteminfo, models.DO_NOTHING, blank=True, null=True)
    buff_id = models.IntegerField(blank=True, null=True)
    buff_buy_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    buff_buy_num = models.IntegerField(blank=True, null=True)
    buff_sell_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    buff_sell_num = models.IntegerField(blank=True, null=True)
    buff_time = models.DateTimeField(blank=True, null=True)
    steam_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    steam_price_cny = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    steam_time = models.DateTimeField(blank=True, null=True)
    wax_price = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    wax_time = models.DateTimeField(blank=True, null=True)
    wax_count = models.IntegerField(blank=True, null=True)
    # dmarket_price = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    # dmarket_time = models.DateTimeField(blank=True, null=True)
    shadow_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    shadow_time = models.DateField(blank=True, null=True)
    shadow_sell_num = models.IntegerField(blank=True, null=True)
    stock = models.IntegerField(blank=True, null=True, default=0)
    star = models.BooleanField(blank=True, null=True)
    cent = models.FloatField(_("cent"), default=0)
    profit = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    card_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wax_avg_sells =  models.IntegerField(blank=True, null=True, default=0)
    c5_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    ig_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    uu_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'price'
```


## 当前代码实现记录

1. 后端已按 `cs_backend\` 创建 Django + DRF 项目，核心 app 包括 `price`、`authuser`、`siteconfig`、`pay`。
2. 前端已采用当前仓库已有目录 `cs_web\` 创建 Next.js + React + TailwindCSS 工作台；提示词中的 `csweb\` 目录命名差异已记录到 `prompt\qa.md`。
3. 套利计算目前支持 BUFF、Waxpeer、ShadowPay。Waxpeer 原始价格按 `wax_price / 1000` 得到美元价格，再按汇率换算成人民币。
4. 出售手续费默认：BUFF `2.5%`，Waxpeer `7%`，ShadowPay 暂按 `5%`，均可通过后端环境变量调整。
5. 默认只输出跨国内/海外平台的套利机会，且买入平台和卖出平台销量都必须大于等于筛选阈值。
6. YouPin 字段、ShadowPay 真实手续费、正式支付渠道、会员权限策略仍待确认，问题集中保存到 `prompt\qa.md`。

