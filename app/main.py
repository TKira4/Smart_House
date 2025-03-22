from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Cấu hình CORS: cho phép tất cả origin và phương thức (OPTIONS, POST, GET, v.v.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi động MQTT
mqtt_client = start_mqtt_client()

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(user_router)       
app.include_router(home_router)       
app.include_router(room_router)       
app.include_router(device_router)     
app.include_router(alert_log_router)  
app.include_router(action_log_router) 

@app.get("/")
def home():
    return {"message": "Smart House API is running!"}
