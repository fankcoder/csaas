import sys
import os
sys.path.append(os.path.dirname(sys.path[0]))
from db import sqlsession as session
from models import ItemInfo, Price
from site_config import get_market_sell_fee, get_usd_cny_rate
from sqlalchemy import desc
import csv


def save_to_csv(data, file_path):
    with open(file_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(data)


def best(page):
    usd_to_cny = float(get_usd_cny_rate(session))
    shadowpay_fee = float(get_market_sell_fee("shadowpay", session))
    wax_fee = float(get_market_sell_fee("waxpeer", session))
    query = session.query(Price).join(ItemInfo, ItemInfo.id == Price.iteminfo_id)
    items = query.filter(Price.buff_sell_price != 0, Price.shadow_price != 0).order_by(desc(Price.shadow_price*usd_to_cny - Price.buff_sell_price)).all()
    result = [['pid', 'name', 'name_cn', 'buff售价', 'buff数量', 'buff求购', 'buff求购量',
     'steam人民币', 'steam美元', 'shadow美元', 'shadow人民币', 'shadow数量', 'sha预计利润', 'wax美元', 'wax人民币', 'wax数量', 'wax预计利润']]
    size = page * 1000
    _page = size - 1000 
    
    for price in items[0:1000]:
        item_info = session.query(ItemInfo).get(price.iteminfo_id)
        # result.append({
        #     'pid': price.id,
        #     'name': item_info.market_hash_name if item_info else None,
        #     'name_cn': item_info.market_name_cn if item_info else None,
        #     'buff_sell_price': float(price.buff_sell_price),
        #     'buff_sell_num': price.buff_sell_num,
        #     'buff_buy_price': price.buff_buy_price,
        #     'buff_buy_num': price.buff_buy_num,
        #     'shadow_price': price.shadow_price,
        #     'shadow_count': price.shadow_count,
        #     # include other fields as needed
        # })
        # print('pid', 'name', 'name_cn', 'buff_sell_price', 'buff_sell_num', 'buff_buy_price', 'buff_buy_num', 'shadow_price', 'shadow_count')
        # print(price.id, item_info.market_hash_name if item_info else None, item_info.market_name_cn if item_info else None, 
        #     float(price.buff_sell_price), price.buff_sell_num, price.buff_buy_price, price.buff_buy_num,
        #     price.shadow_price, price.shadow_count,
        # )

        float_shadow_price = round(float(price.shadow_price)*usd_to_cny, 2)
        shadow_withdrow = (float_shadow_price - (float_shadow_price*shadowpay_fee))*0.95
        profit = round(shadow_withdrow - float(price.buff_sell_price), 2)

        #waxpeer
        two_wax_price = round(float(price.wax_price)/1000, 2)
        float_wax_price = round(two_wax_price*usd_to_cny, 2)
        wax_withdrow = (float_wax_price - (float_wax_price*wax_fee))*0.98
        wax_profit = round(wax_withdrow - float(price.buff_sell_price), 2)


        result.append([price.id, item_info.market_hash_name if item_info else None, item_info.market_name_cn if item_info else None, 
            float(price.buff_sell_price), price.buff_sell_num, price.buff_buy_price, price.buff_buy_num, 
            price.steam_price_cny, price.steam_price,
            round(float(price.shadow_price), 2),
            float_shadow_price, price.shadow_sell_num, profit, round(float(two_wax_price), 2),
            float_wax_price, price.wax_count, wax_profit])
    # print(result)
    save_to_csv(result, './sell_output0728.csv')
    return result
    

if __name__ == "__main__":
    page = 1
    best(page)
    # print(session)
