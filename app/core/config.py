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
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.example.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your_email@example.com")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your_password")


settings = Settings()
