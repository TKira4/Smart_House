import requests
from app.core.config import settings
import httpx
import asyncio

def control_device(feed_name: str, value: str):
    url = f"https://io.adafruit.com/api/v2/{settings.ADAFRUIT_USERNAME}/feeds/{feed_name}/data"
    headers = {
        "X-AIO-Key": settings.ADAFRUIT_KEY,
        "Content-Type": "application/json"
    }
    data = {"value": value}
    response = requests.post(url, headers=headers, json=data)
    return response.status_code, response.json()

def get_last_data(feed_name: str):
    """
    Lấy dữ liệu mới nhất từ feed của Adafruit IO.
    """
    url = f"https://io.adafruit.com/api/v2/{settings.ADAFRUIT_USERNAME}/feeds/{feed_name}/data/last"
    headers = {"X-AIO-Key": settings.ADAFRUIT_KEY}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def get_feed_history(feed_name: str, limit: int = 50):
    """
    Lấy lịch sử dữ liệu từ feed của Adafruit IO.
    """
    url = f"https://io.adafruit.com/api/v2/{settings.ADAFRUIT_USERNAME}/feeds/{feed_name}/data?limit={limit}"
    headers = {"X-AIO-Key": settings.ADAFRUIT_KEY}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

async def fetch_last_data(feed_name: str):
    url = f"https://io.adafruit.com/api/v2/{settings.ADAFRUIT_USERNAME}/feeds/{feed_name}/data/last"
    headers = {"X-AIO-Key": settings.ADAFRUIT_KEY}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        if r.status_code == 200:
            return feed_name, r.json()
        else:
            return feed_name, {}

async def get_all_last_data(devices):
    tasks = [fetch_last_data(d.feedName) for d in devices]
    results = await asyncio.gather(*tasks)
    return dict(results)  # Trả về {feedName: last_data_dict}