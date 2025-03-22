from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.home import Home
from app.models.room import Room

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# Schema cho đăng ký Room
class RoomRegisterRequest(BaseModel):
    nameRoom: str
    
#lấy danh sách room trong home
@router.get("/home/{home_id}/rooms", response_model=list)
def get_rooms(home_id: int, db: Session = Depends(get_db)):
    rooms = db.query(Room).filter(Room.homeID == home_id).all()
    if not rooms:
        raise HTTPException(status_code=404, detail={"error": "No rooms found in this home", "status_code": 404})
    return [{"roomID": room.roomID, "nameRoom": room.nameRoom} for room in rooms]

#đăng ký room mới
@router.post("/home/{home_id}/room_register", status_code=status.HTTP_201_CREATED)
def register_room(home_id: int, request: RoomRegisterRequest, db: Session = Depends(get_db)):
    home = db.query(Home).filter(Home.homeID == home_id).first()
    if not home:
        raise HTTPException(status_code=404, detail={"error": "Home not found", "status_code": 404})
    new_room = Room(nameRoom=request.nameRoom, homeID=home_id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return {
        "message": "Room registered successfully",
        "room": {
            "roomID": new_room.roomID,
            "nameRoom": new_room.nameRoom,
            "homeID": new_room.homeID
        }
    }
    
@router.delete("/home/{home_id}/delete", status_code=200)
def delete_home(home_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    home = db.query(Home).filter(Home.homeID == home_id, Home.ownerID == user_id).first()
    if not home:
        raise HTTPException(status_code=404, detail="Home not found or does not belong to user")
    db.delete(home)
    db.commit()
    return {"message": "Home deleted successfully"}


class HomeSchema(BaseModel):
    homeID: int
    address: str
    ownerID: int

    class Config:
        orm_mode = True  # cho phép chuyển đổi ORM object sang schema

@router.get("/home/{home_id}", response_model=HomeSchema)
def get_home(home_id: int, db: Session = Depends(get_db)):
    home = db.query(Home).filter(Home.homeID == home_id).first()
    if not home:
        raise HTTPException(status_code=404, detail="Home not found")
    return home




