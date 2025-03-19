import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    MQTT_BROKER: str = os.getenv("MQTT_BROKER")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", 1883))
    MQTT_KEEPALIVE: int = int(os.getenv("MQTT_KEEPALIVE", 60))
    MQTT_USERNAME: str = os.getenv("MQTT_USERNAME")
    MQTT_PASSWORD: str = os.getenv("MQTT_PASSWORD")
    ADAFRUIT_USERNAME: str = os.getenv("ADAFRUIT_USERNAME")
    ADAFRUIT_KEY: str = os.getenv("ADAFRUIT_KEY")

settings = Settings()
