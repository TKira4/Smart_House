import paho.mqtt.client as mqtt
from app.core.config import settings
print(f"MQTT_BROKER: '{settings.MQTT_BROKER}', Port: {settings.MQTT_PORT}, Keepalive: {settings.MQTT_KEEPALIVE}")
# Callback khi kết nối
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe(f"{settings.MQTT_USERNAME}/feeds/#")

# Callback khi nhận message
def on_message(client, userdata, msg):
    print(f"Received message from {msg.topic}: {msg.payload.decode()}")

def start_mqtt_client():
    client = mqtt.Client()
    client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, settings.MQTT_KEEPALIVE)
    client.loop_start()
    return client
