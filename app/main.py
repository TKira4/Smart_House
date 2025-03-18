from fastapi import FastAPI
from app.api.v1.routes import auth_router, user_router, home_router, room_router, device_router, alert_log_router, action_log_router

app = FastAPI()

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
