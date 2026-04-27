import requests

url = "https://api.youpin898.com/api/homepage/new/es/template/GetCsGoPagedList"

headers = {
    "Host": "api.youpin898.com",
    "api-version": "1.0",
    "tracestate": "bnro=android/10_android/8.12.1_okhttp/3.14.9",
    "traceparent": "00-55bb477975d946db992a578adf58f59d-8577e5e1c19ecc4f-01",
    "devicetoken": "Zt/RvRTPvpIDANJ+y2NUZqX8",
    "deviceid": "Zt/RvRTPvpIDANJ+y2NUZqX8",
    "requesttag": "4E101ECC0AFD39768BF003274B1D9D75",
    "devicetype": "1",
    "platform": "android",
    "currenttheme": "Light",
    "package-type": "uuyp",
    "app-version": "5.21.2",
    "uk": "5CogW01aBJMj27Oi1BAwBkGY7XitcHkJBzQu4OgTgZ4pmiGLX266V2yuA5N7GzV1F",
    "device-info": '{"deviceId":"Zt/RvRTPvpIDANJ+y2NUZqX8","deviceType":"MIX2S","hasSteamApp":1,"requestTag":"DDA1E0A7AF3354FAB63BF085850EEDD7","systemName":"Android","systemVersion":"10"}',
    "apptype": "4",
    "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMjhjMGI5NjhkNzQ0NzUwYmM4OTI0Yzg5OTk0ODQ4OSIsIm5hbWVpZCI6IjgxNTI0ODUiLCJJZCI6IjgxNTI0ODUiLCJ1bmlxdWVfbmFtZSI6IllQMDAwODE1MjQ4NSIsIk5hbWUiOiJZUDAwMDgxNTI0ODUiLCJ2ZXJzaW9uIjoiMEt3IiwibmJmIjoxNzI1OTQ0MzY5LCJleHAiOjE3Mjk0NTc5NjksImlzcyI6InlvdXBpbjg5OC5jb20iLCJkZXZpY2VJZCI6Ilp0L1J2UlRQdnBJREFOSit5Mk5VWnFYOCIsImF1ZCI6InVzZXIifQ.nGunVF9tXVXXl94syWPt2XP9r95uWkVEoPaal79clf4",
    "content-type": "application/json; charset=utf-8",
    "user-agent": "okhttp/3.14.9"
}

data = {
    "filterMap": {
        "Type": ["weapon_m4a1"]
    },
    "gameId": 730,
    "listSortType": 0,
    "listType": 10,
    "pageIndex": 2,
    "pageSize": 100,
    "propertyFilterTags": [],
    "sortType": 0,
    "stickerAbrade": 0,
    "stickersIsSort": False,
    "Sessionid": "Zt/RvRTPvpIDANJ+y2NUZqX8"
}

response = requests.post(url, headers=headers, json=data)

print(response.text)