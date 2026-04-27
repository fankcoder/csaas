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
    wax_fee = float(get_market_sell_fee("waxpeer", session))
    query = session.query(Price).join(ItemInfo, ItemInfo.id == Price.iteminfo_id)
    items = query.filter(Price.buff_sell_price != 0, Price.wax_price != 0).order_by(desc((Price.wax_price/1000)*usd_to_cny - Price.buff_sell_price)).all()
    result = [['pid', 'name', 'name_cn', 'buff售价', 'buff数量', 'buff求购', 'buff求购量',
     'steam人民币', 'steam美元', 'wax美元', 'wax人民币', 'wax数量', '预计利润']]
    size = page * 1000
    _page = size - 1000 
    
    for price in items:
        item_info = session.query(ItemInfo).get(price.iteminfo_id)
        # result.append({
        #     'pid': price.id,
        #     'name': item_info.market_hash_name if item_info else None,
        #     'name_cn': item_info.market_name_cn if item_info else None,
        #     'buff_sell_price': float(price.buff_sell_price),
        #     'buff_sell_num': price.buff_sell_num,
        #     'buff_buy_price': price.buff_buy_price,
        #     'buff_buy_num': price.buff_buy_num,
        #     'wax_price': price.wax_price,
        #     'wax_count': price.wax_count,
        #     # include other fields as needed
        # })
        # print('pid', 'name', 'name_cn', 'buff_sell_price', 'buff_sell_num', 'buff_buy_price', 'buff_buy_num', 'wax_price', 'wax_count')
        # print(price.id, item_info.market_hash_name if item_info else None, item_info.market_name_cn if item_info else None, 
        #     float(price.buff_sell_price), price.buff_sell_num, price.buff_buy_price, price.buff_buy_num,
        #     price.wax_price, price.wax_count,
        # )
        two_wax_price = round(float(price.wax_price)/1000, 2)
        float_wax_price = round(two_wax_price*usd_to_cny, 2)
        wax_withdrow = (float_wax_price - (float_wax_price*wax_fee))*0.98
        profit = round(wax_withdrow - float(price.buff_sell_price), 2)

        result.append([price.id, item_info.market_hash_name if item_info else None, item_info.market_name_cn if item_info else None, 
            float(price.buff_sell_price), price.buff_sell_num, price.buff_buy_price, price.buff_buy_num, 
            price.steam_price_cny, price.steam_price,
            round(float(two_wax_price), 2),
            float_wax_price, price.wax_count, profit])
    # print(result)
    save_to_csv(result, './wax_output.csv')
    return result
    
def clean():
    query = session.query(Price).join(ItemInfo, ItemInfo.id == Price.iteminfo_id)
    for item in query.all():
        if item.wax_price < 100:
            print(item.wax_price)
            item.wax_price = 0
            session.commit()

if __name__ == "__main__":
    page = 1
    best(page)
    # clean()
    # print(session)
