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

@router.delete("/home/{home_id}/room_delete/{room_id}", status_code=200)
def delete_room(
    home_id: int,
    room_id: int,
    db: Session = Depends(get_db)
):
    # Verify the home exists
    home = db.query(Home).filter(Home.homeID == home_id).first()
    if not home:
        raise HTTPException(status_code=404, detail="Home not found")
    
    # Verify the room exists and belongs to this home
    room = db.query(Room).filter(Room.roomID == room_id, Room.homeID == home_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found in this home")
    
    try:
        # Delete the room
        db.delete(room)
        db.commit()
        return {"message": "Room deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting room: {str(e)}")
    
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

@router.get("/home/{home_id}/status")
def get_home_safety_status(home_id: int, db: Session = Depends(get_db)):
    home = db.query(Home).filter(Home.homeID == home_id).first()
    if not home:
        raise HTTPException(status_code=404, detail="Home not found")

    is_safe = True
    reasons = []

    for room in home.rooms:
        for device in room.devices:
            if device.value is None:
                continue
            value = float(device.value)
            threshold = device.threshold
            if device.feedName == "nhietdo" and value > threshold:
                is_safe = False
                reasons.append(f"Nhiệt độ cao: {value}°C")
            elif device.feedName == "doam" and value < 20:
                if value < 20:
                    is_safe = False
                    reasons.append(f"Độ ẩm thấp: {device.value}%")
                elif value > threshold: 
                    is_safe = False
                    reasons.append(f"Độ ẩm cao: {device.value}%")
            elif device.feedName == "anhsang" and value > threshold:
                is_safe = False
                reasons.append(f"Ánh sáng mạnh: {device.value} lux")

    return {
        "home_id": home_id,
        "is_safe": is_safe,
        "reasons": reasons,
    }


