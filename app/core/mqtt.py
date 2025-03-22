import paho.mqtt.client as mqtt
import datetime
import smtplib
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
from app.models.room import Room
from app.models.home import Home
from app.models.device import Device
from app.models.alert_log import AlertLog

print(f"MQTT_BROKER: '{settings.MQTT_BROKER}', Port: {settings.MQTT_PORT}, Keepalive: {settings.MQTT_KEEPALIVE}")

def get_owner_email(feed_name, db: Session):
    # Tìm thiết bị theo feedName
    device = db.query(Device).filter(Device.feedName == feed_name).first()
    if not device:
        return None
    # Lấy Room của thiết bị
    room = db.query(Room).filter(Room.roomID == device.roomID).first()
    if not room:
        return None
    # Lấy Home của phòng
    home = db.query(Home).filter(Home.homeID == room.homeID).first()
    if not home:
        return None
    # Lấy User theo ownerID của home
    user = db.query(User).filter(User.userID == home.ownerID).first()
    if not user:
        return None
    return user.email

def send_alert_email(device, current_value, receiver_email):
    sender = settings.SMTP_USERNAME  # Dùng SMTP_USERNAME làm sender
    receivers = [receiver_email]
    subject = f"Alert: {device.deviceName} exceeded threshold"
    body = (f"Thiết bị {device.deviceName} (ID: {device.deviceID}) đã vượt ngưỡng.\n"
            f"Giá trị hiện tại: {current_value}\n"
            f"Ngưỡng cài đặt: {device.threshold}")
    
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(receivers)
    
    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(sender, receivers, msg.as_string())
        print("Alert email sent successfully.")
    except Exception as e:
        print("Failed to send alert email:", e)

# Callback khi kết nối
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    # Subscribe vào tất cả các feed của username
    client.subscribe(f"{settings.MQTT_USERNAME}/feeds/#")

# Callback khi nhận message
def on_message(client, userdata, msg):
    payload_str = msg.payload.decode()
    print(f"Received message from {msg.topic}: {payload_str}")
    
    topic_parts = msg.topic.split("/")
    if len(topic_parts) < 3:
        print("Topic không hợp lệ:", msg.topic)
        return
    feed_name = topic_parts[-1]

    db = SessionLocal()
    try:
        device = db.query(Device).filter(Device.feedName == feed_name).first()
        if device:
            try:
                new_value = float(payload_str)
            except ValueError:
                new_value = None
            
            if new_value is not None:
                device.value = new_value
                db.commit()
                db.refresh(device)
                print(f"Updated {device.deviceName} value to {new_value}")
                
                # Nếu có threshold và giá trị vượt ngưỡng, tạo AlertLog và gửi email
                if device.threshold is not None and new_value >= device.threshold:
                    # Lấy email của chủ thiết bị
                    owner_email = get_owner_email(feed_name, db)
                    if owner_email:
                        new_alert = AlertLog(
                            deviceID=device.deviceID,
                            alertType="Threshold Exceeded",
                            alertValue=str(new_value),
                            alertStatus="Pending",
                            timestamp=datetime.datetime.utcnow()
                        )
                        db.add(new_alert)
                        db.commit()
                        send_alert_email(device, new_value, owner_email)
                        print("Threshold exceeded: Alert log created and email sent.")
                    else:
                        print("Không tìm thấy email của chủ thiết bị.")
    except Exception as e:
        print("Error processing message:", e)
    finally:
        db.close()

def start_mqtt_client():
    client = mqtt.Client()
    client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, settings.MQTT_KEEPALIVE)
    client.loop_start()
    return client
