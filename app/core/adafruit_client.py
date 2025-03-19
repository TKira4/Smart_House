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
