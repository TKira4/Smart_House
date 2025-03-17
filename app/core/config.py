import os
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    MQTT_BROKER: str = os.getenv("MQTT_BROKER")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", 1883))
    MQTT_USERNAME: str = os.getenv("MQTT_USERNAME")
    MQTT_PASSWORD: str = os.getenv("MQTT_PASSWORD")
    SECRET_KEY: str = os.getenv("SECRET_KEY")

settings = Settings()
