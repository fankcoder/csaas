配合前端完成完整的注册登录功能，注册要发邮件，接受验证码，或者steam直接登录。

要有个人中心，个人中心查询当前的账户信息的接口，还有在个人中心可以绑定steam，可以查询自己steam的库存饰品，登录之后通过这个api可以查询到https://steamcommunity.com/inventory/76561198153187116/730/2

部分数据结构如下：
{
assets: [
{
appid: 730,
contextid: "2",
assetid: "19329077009",
classid: "7993037467",
instanceid: "188530139",
amount: "1"
},
{
appid: 730,
contextid: "2",
assetid: "15162613612",
classid: "3106076676",
instanceid: "0",
amount: "1"
},
{
appid: 730,
contextid: "2",
assetid: "12016830789",
classid: "6276298491",
instanceid: "6280698872",
amount: "1"
},
{
appid: 730,
contextid: "2",
assetid: "11889848765",
classid: "2521817699",
instanceid: "0",
amount: "1"
},
{
appid: 730,
contextid: "2",
assetid: "8250006340",
classid: "1989275815",
instanceid: "302028390",
amount: "1"
}
],
descriptions: [
{
appid: 730,
classid: "7993039198",
instanceid: "188695601",
currency: 0,
background_color: "3d293f",
icon_url: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1c4_2tY5tgKeKBAXWvzO9std5_HRajkBw1vwKIn4vwNCaJagYiWJFzQ-cOuhC6w93lYby34wHb39oXmSz2iyhAvS9usexRUKcm-rqX0V-HCRcuyA",
descriptions: [
{
type: "html",
value: "外观： 久经沙场",
name: "exterior_wear"
},
{
type: "html",
value: " ",
name: "blank"
},
{
type: "html",
value: "该物品具有 StatTrak™ 技术，在其所有者装备时能跟踪若干统计数据。",
color: "99ccff",
name: "stattrak_type"
},
{
type: "html",
value: " ",
name: "blank"
},
{
type: "html",
value: "StatTrak™ 已认证杀敌数：667",
color: "CF6A32",
name: "stattrak_score"
},
{
type: "html",
value: "*当该物品被用于 Steam 交易或社区市场时，统计将被重置",
color: "ff4040",
name: "stattrak_warn"
},
{
type: "html",
value: " ",
name: "blank"
},
{
type: "html",
value: "格洛克18型是把耐用的第一回合手枪，非常适合对付那些没有穿护甲的对手，并且可以进行三连发爆炸开火。 这把武器的定制涂装呈现出马赛克镜面般的视觉效果。

<i>困于自我思绪之境</i>",
name: "description"
},
{
type: "html",
value: " ",
name: "blank"
},
{
type: "html",
value: "创世纪收藏品",
color: "9da1a9",
name: "itemset_name"
},
{
type: "html",
value: " ",
name: "blank"
}
],
tradable: 1,
actions: [
{
link: "steam://run/730//+csgo_econ_action_preview%20%propid:6%",
name: "在游戏中检视…"
}
],
name: "格洛克18型（StatTrak™） | 镜面马赛克",
name_color: "d32ce6",
type: "StatTrak™ 保密级 手枪",
market_name: "格洛克18型（StatTrak™） | 镜面马赛克 (久经沙场)",
market_hash_name: "StatTrak™ Glock-18 | Mirror Mosaic (Field-Tested)",
market_actions: [
{
link: "steam://run/730//+csgo_econ_action_preview%20%propid:6%",
name: "在游戏中检视…"
}
],
commodity: 0,
market_tradable_restriction: 7,
market_marketable_restriction: 7,
marketable: 1,
tags: [
{
category: "Type",
internal_name: "CSGO_Type_Pistol",
localized_category_name: "类型",
localized_tag_name: "手枪"
},
{
category: "Weapon",
internal_name: "weapon_glock",
localized_category_name: "武器",
localized_tag_name: "格洛克18型"
},
{
category: "ItemSet",
internal_name: "set_community_36",
localized_category_name: "收藏品",
localized_tag_name: "创世纪收藏品"
},
{
category: "Quality",
internal_name: "strange",
localized_category_name: "类别",
localized_tag_name: "StatTrak™",
color: "CF6A32"
},
{
category: "Rarity",
internal_name: "Rarity_Legendary_Weapon",
localized_category_name: "品质",
localized_tag_name: "保密级",
color: "d32ce6"
},
{
category: "Exterior",
internal_name: "WearCategory2",
localized_category_name: "外观",
localized_tag_name: "久经沙场"
}
]....
tradable: 0,
actions: [
{
link: "steam://run/730//+csgo_econ_action_preview%2079697961BC7359795178497D1B7E717969DF74497A117909617B2FAA66",
name: "在游戏中检视…"
}
],
name: "涂鸦 | 双杀 (黄褐)",
name_color: "b0c3d9",
type: "普通级 涂鸦",
market_name: "涂鸦 | 双杀 (黄褐)",
market_hash_name: "Graffiti | Double (Tiger Orange)",
market_actions: [
{
link: "steam://run/730//+csgo_econ_action_preview%2079697961BC7359795178497D1B7E717969DF74497A117909617B2FAA66",
name: "在游戏中检视…"
}
],
commodity: 1,
market_tradable_restriction: 7,
market_marketable_restriction: 7,
marketable: 0,
tags: [
{
category: "Type",
internal_name: "CSGO_Type_Spray",
localized_category_name: "类型",
localized_tag_name: "涂鸦"
},
{
category: "Quality",
internal_name: "normal",
localized_category_name: "类别",
localized_tag_name: "普通"
},
{
category: "Rarity",
internal_name: "Rarity_Common",
localized_category_name: "品质",
localized_tag_name: "普通级",
color: "b0c3d9"
},
{
category: "SprayColorCategory",
internal_name: "Tint3",
localized_category_name: "涂鸦颜色",
localized_tag_name: "黄褐"
}
],
sealed: 0,
market_bucket_group_name: "涂鸦 | 双杀",
market_bucket_group_id: "G18C50A30046205080010A60D",
sealed_type: 0
}
],
asset_properties: [
{
appid: 730,
contextid: "2",
assetid: "48389380180",
asset_properties: [
{
propertyid: 1,
int_value: "732",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.32147631049156189",
name: "磨损率"
},
{
propertyid: 6,
string_value: "564682E6BBF7E2574E5276925C7E53665F6EDDE7C4A355168A531E5606CD533E70265E11ACD43F",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "44910234023",
asset_properties: [
{
propertyid: 1,
int_value: "569",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.140122950077056885",
name: "磨损率"
},
{
propertyid: 6,
string_value: "B5A512265A1312B4AD9D9516BC9DB685B18D514D0845B6F50CB1DD81C5BDEF029461",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "44582516911",
asset_properties: [
{
propertyid: 1,
int_value: "171",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.0480514802038669586",
name: "磨损率"
},
{
propertyid: 6,
string_value: "FFEF500E337559FEE7DBDF06F6D7FECFFBC75E5C6C15FCBF54FE97E18FE7D5B6B197",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "43941083622",
asset_properties: [
{
propertyid: 1,
int_value: "86",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.102927997708320618",
name: "磨损率"
},
{
propertyid: 6,
string_value: "4F5FA9BC9197EC4E57516FB046674E7F4B77A5D884A14C0F19274E3F57D1855345",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "43816616802",
asset_properties: [
{
propertyid: 6,
string_value: "6E7E8CE8DCF3CD6F76B9484E6E46685E6A06601E6771E670CD",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "38188650979",
asset_properties: [
{
propertyid: 6,
string_value: "2131C282C380AF20398B0701210927112549615128DBF989F2",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "37653841290",
asset_properties: [
{
propertyid: 1,
int_value: "977",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.219431608915328979",
name: "磨损率"
},
{
propertyid: 6,
string_value: "B2A2383952103EB3AAAE923DB49AB082B68A1C573041B1F263B5D0A6BAB1A2698B9FB2B21A738FB251B808F7A2A5398EDA52B3C2AAA36E620A",
name: "物品证书"
}
],
asset_accessories: [
{
classid: "7729074545",
parent_relationship_properties: [
{
propertyid: 4,
float_value: "0"
}
]
}
]
},
{
appid: 730,
contextid: "2",
assetid: "41633161769",
asset_properties: [
{
propertyid: 6,
string_value: "97873E53091B0C968F6DB1B797BF91A793FF9FE79E04D74CE7",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "33609766023",
asset_properties: [
{
propertyid: 6,
string_value: "A0B02709113ADDB844A780A088A690A4C88AD0A08BF24ABA",
name: "物品证书"
}
]
},
{
appid: 730,
contextid: "2",
assetid: "31667137209",
asset_properties: [
{
propertyid: 1,
int_value: "558",
name: "图案模板"
},
{
propertyid: 2,
float_value: "0.128575786948204041",
name: "磨损率"
},
{
propertyid: 6,
string_value: "C9D9701C4135BCD1EAE9CAE1CBF9CDF1161B4739CA8967CDA12BC8B9D135BE13CC",
name: "物品证书"
}
]
}
],
total_inventory_count: 60,
success: 1,
rwgrsn: -2
}


  

补充接口权限校验功能，高级功能需要登录并且订阅之后才可以使用。
创建一个开发测试账户，有最高级的权限。



