from fastapi import FastAPI
from app.api.v1.routes import auth  # file auth.py

app = FastAPI()

app.include_router(auth.router, prefix="/api/v1/auth")  # Gắn route /api/v1/auth/signup

@app.get("/")
def home():
    return {"message": "Smart House API is running!"}
