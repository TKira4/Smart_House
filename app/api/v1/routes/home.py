from fastapi import APIRouter, HTTPException, Depends, status
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
