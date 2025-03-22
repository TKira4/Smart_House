# app/api/v1/routes/user.py
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import SessionLocal
from app.models.user import User
from app.models.home import Home

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

##### SCHEMA dang ky home #####
class HomeRegisterRequest(BaseModel):
    address: str

#### ENDPOINT #####
#Trả về toàn bộ Home mà User đăng ký
@router.get("/user/{user_id}/homes", response_model=list)
def get_user_homes(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.userID == user_id).first()
    if not user or not user.homes:
        raise HTTPException(status_code=401, detail={"error": "User has no homes registered", "status_code": 401})
    return [{"homeID": home.homeID, "address": home.address, "ownerID": home.ownerID} for home in user.homes]

#Thay đổi Active Home
@router.put("/user/{user_id}/active-home", response_model=dict)
def update_active_home(user_id: int, activeHomeID: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"error": "User not found", "status_code": 404})
    #Check xem ngôi nhà có thuộc về user không
    if activeHomeID not in [home.homeID for home in user.homes]:
        raise HTTPException(status_code=400, detail={"error": "Home does not belong to user", "status_code": 400})
    user.activeHomeID = activeHomeID
    db.commit()
    return {"message": "Active home updated successfully", "activeHomeID": activeHomeID}

@router.post("/user/{user_id}/home_register", status_code=status.HTTP_201_CREATED)
def register_home(user_id: int, request: HomeRegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"error": "User not found", "status_code": 404})
    new_home = Home(address=request.address, ownerID=user_id)
    db.add(new_home)
    db.commit()
    db.refresh(new_home)
    return {
        "message": "Home registered successfully",
        "home": {
            "homeID": new_home.homeID,
            "address": new_home.address,
            "ownerID": new_home.ownerID
        }
    }
    
@router.delete("/home/{home_id}/delete", status_code=200)
def delete_home(home_id: int, user_id: int, db: Session = Depends(get_db)):
    # Chỉ xóa nếu nhà thuộc về người dùng với user_id được cung cấp
    home = db.query(Home).filter(Home.homeID == home_id, Home.ownerID == user_id).first()
    if not home:
        raise HTTPException(status_code=404, detail="Home not found or does not belong to user")
    db.delete(home)
    db.commit()
    return {"message": "Home deleted successfully"}

