from db import sqlsession
from models import ItemInfo, Price, BuffPriceHistory, SteamPriceHistory, SiteConfig
import time
from datetime import datetime
import random
import requests
import json
from config import get_c5_header

c5_url = [
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_ak47&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 5
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_awp&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 3
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_m4a1_silencer&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 4
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_m4a1&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 3
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_deagle&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 3
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_usp_silencer&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 3
    },
    {
        'url': 'https://www.c5game.com/csgo?appId=730&page={}&limit=42&sort=0&type=weapon_glock&changePrice=2000&minPrice=100&maxPrice=2000',
        'page': 2
    },
]


def crawl(url, header):
    # print(url, header)
    # with open('./lookprice/buff_example_data.json', 'r') as f:
    #     data = json.load(f)
        # print(data)
    data = {}
    response = requests.get(url, headers=header)
    if response.status_code == 200:
        data = response.json()
    if data.get('code') == "OK":
        items_data = data.get('data').get('list')
        for item in items_data:
            market_hash_name = item.get('marketHashName')
            c5_price = item.get('price')
            sell_num = item.get('quantity')
            name_cn = item.get('itemName')

            print(market_hash_name, name_cn, c5_price, sell_num)
            item = sqlsession.query(ItemInfo).filter_by(market_hash_name=market_hash_name).first()
            if not item:
                continue
            # print(item.market_name_cn)
            if item.market_name_cn == None:
                item.market_name_cn = name_cn
                sqlsession.commit()
            price = sqlsession.query(Price).filter_by(iteminfo_id=item.id).first()
            if price == None:
                price = Price(iteminfo_id=item.id, c5_price=c5_price)
                sqlsession.add(price)
                sqlsession.commit()
            else:
                price.c5_price = c5_price
                sqlsession.commit()


def main():
    header = get_c5_header()
    if header is None:
        return
    for item in c5_url:
        _url = item.get('url')
        page = item.get('page')
        for i in range(0, page):
            url = _url.format(i+1)
            print(url)
            header['Referer'] = url
            crawl(url, header)
            rand = random.randint(2,8)
            print('sleep', rand)
            time.sleep(rand)
    sc = sqlsession.query(SiteConfig).filter_by(key='c5_update').first()
    sc.value = datetime.now()
    sqlsession.commit()


if __name__ == '__main__':
    # print(mysql_session)
    main()