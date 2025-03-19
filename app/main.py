from fastapi import FastAPI
from app.core.mqtt import start_mqtt_client
from app.api.v1.routes import (
    auth_router,
    user_router,
    home_router,
    room_router,
    device_router,
    alert_log_router,
    action_log_router
)

app = FastAPI()

# Khởi động MQTT khi ứng dụng khởi động
mqtt_client = start_mqtt_client()

# Include các router (bạn có thể thêm prefix cho các router khác nếu cần)
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(user_router)       # Các endpoint: /user/{user_id}/homes, /user/{user_id}/active-home, /user/{user_id}/home/register
app.include_router(home_router)       # Nếu có endpoint riêng cho Home (có thể để trống nếu chỉ dùng ở user)
app.include_router(room_router)       # Các endpoint: /home/{home_id}/rooms, /room/{room_id}/monitoring, /home/{home_id}/room_register
app.include_router(device_router)     # Các endpoint: /room/{room_id}/devices, /device/{device_id}/state, /room/{room_id}/device_register, /control
app.include_router(alert_log_router)  # Endpoint: /room/{room_id}/alerts
app.include_router(action_log_router) # Endpoint: /device/{device_id}/actions

@app.get("/")
def home():
    return {"message": "Smart House API is running!"}
