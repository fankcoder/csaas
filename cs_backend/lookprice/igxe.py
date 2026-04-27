from db import sqlsession
from models import ItemInfo, Price, BuffPriceHistory, SteamPriceHistory, SiteConfig
import time
from datetime import datetime
import random
import requests
import json
from config import get_ig_header

ig_url = [
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=4&type_id=27&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 10
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=4&type_id=28&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 7
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=4&type_id=26&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 7
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=4&type_id=25&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 7
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=1&type_id=7&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 5
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=1&type_id=2&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 7
    },
    {
        'url': 'https://www.igxe.cn/api/v2/product/search/730?app_id=730&ctg_id=1&type_id=3&price_from=100&price_to=2000&sort=3&page_no={}&page_size=20',
        'page': 4
    }
]

def crawl(url, header):
    data = {}
    response = requests.get(url, headers=header)
    if response.status_code == 200:
        data = response.json()
    if data.get('code') == "OK":
        items_data = data.get('data').get('data')
        for item in items_data:
            market_hash_name = item.get('market_hash_name')
            ig_price = item.get('min_price')
            sell_num = item.get('sale_count')
            name_cn = item.get('market_name')

            print(market_hash_name, name_cn, ig_price, sell_num)
            item = sqlsession.query(ItemInfo).filter_by(market_hash_name=market_hash_name).first()
            if not item:
                continue
            # print(item.market_name_cn)
            if item.market_name_cn == None:
                item.market_name_cn = name_cn
                sqlsession.commit()
            price = sqlsession.query(Price).filter_by(iteminfo_id=item.id).first()
            if price == None:
                price = Price(iteminfo_id=item.id, ig_price=ig_price )
                sqlsession.add(price)
                sqlsession.commit()
            else:
                price.ig_price = ig_price
                sqlsession.commit()

def main():
    header = get_ig_header()
    if header is None:
        return
    for item in ig_url:
        _url = item.get('url')
        page = item.get('page')
        for i in range(0, page):
            url = _url.format(i+1)
            print(url)
            crawl(url, header)
            rand = random.randint(2,8)
            print('sleep', rand)
            time.sleep(rand)
    sc = sqlsession.query(SiteConfig).filter_by(key='ig_update').first()
    sc.value = datetime.now()
    sqlsession.commit()


if __name__ == '__main__':
    # print(mysql_session)
    main()