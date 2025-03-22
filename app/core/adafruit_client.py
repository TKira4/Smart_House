import requests
from app.core.config import settings

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

def get_feed_history(feed_name: str, limit: int = 20):
    """
    Lấy lịch sử dữ liệu từ feed của Adafruit IO.
    """
    url = f"https://io.adafruit.com/api/v2/{settings.ADAFRUIT_USERNAME}/feeds/{feed_name}/data?limit={limit}"
    headers = {"X-AIO-Key": settings.ADAFRUIT_KEY}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()