from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
import jwt
import datetime

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.user import User

router = APIRouter()

# Cài đặt context để hash mật khẩu (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

####################### SCHEMA #############################
class SignUpSchema(BaseModel):
    fName: str
    lName: str
    email: EmailStr
    userName: str
    phoneNumber: str | None = None
    password: str
    confirmPassword: str

class SignInSchema(BaseModel):
    identifier: str
    password: str

################# SESSION DB ###################
# Dependency để lấy session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

############### API ENDPOINT ######################
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def sign_up(user_data: SignUpSchema, db: Session = Depends(get_db)):
    # Kiểm tra password và confirmPassword
    if user_data.password != user_data.confirmPassword:
        raise HTTPException(
            status_code=400,
            detail="Password and confirm password do not match."
        )
    
    # Kiểm tra xem userName hoặc email đã tồn tại chưa
    existing_user = db.query(User).filter(
        (User.userName == user_data.userName) | (User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this username or email already exists."
        )
    
    # Hash mật khẩu
    hashed_password = pwd_context.hash(user_data.password)
    
    # Tạo user mới
    new_user = User(
        fName=user_data.fName,
        lName=user_data.lName,
        email=user_data.email,
        userName=user_data.userName,
        phoneNumber=user_data.phoneNumber,  
        password=hashed_password               
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Sign up success",
        "user": {
            "userID": new_user.userID,
            "userName": new_user.userName,
            "email": new_user.email
        }
    }

@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_data: SignInSchema, db: Session = Depends(get_db)):
    #Tìm user 
    user = db.query(User).filter(
        or_(
            User.userName == user_data.identifier,
            User.email == user_data.identifier,
            User.phoneNumber == user_data.identifier
        )
    ).first()
    
    if not user or not pwd_context.verify(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    #Tạo jwt token trong 1 giờ
    payload = {
        "userID": user.userID,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    
    return {"message": "Login successful", "access_token": token, "token_type": "bearer"}
    