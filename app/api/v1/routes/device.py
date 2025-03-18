from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import datetime

from app.core.database import SessionLocal
from app.models.device import Device
from app.models.room import Room

router = APIRouter()

# Dependency lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#############################
# Schema cho đăng ký Device
#############################
class DeviceRegisterSchema(BaseModel):
    deviceName: str
    state: str = "OFF"          
    value: float | None = None   
    type: str                   

#Trả về toàn bộ thiết bị thuộc về phòng đó
@router.get("/room/{room_id}/devices", response_model=list)
def get_devices_in_room(room_id: int, db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.roomID == room_id).all()
    if not devices:
        raise HTTPException(status_code=404, detail={"error": "No devices found in this room", "status_code": 404})
    return [{
        "deviceID": d.deviceID,
        "deviceName": d.deviceName,
        "state": d.state,
        "type": d.type,
        "value": float(d.value) if d.value is not None else None
    } for d in devices]

#Cài đặt trạng thái của thiết bị (Sau này có thể update tính năng advanced cài đặt alert value)
@router.put("/device/{device_id}/state", response_model=dict)
def update_device_state(device_id: int, state: dict, db: Session = Depends(get_db)):
    new_state = state.get("state")
    if new_state not in ["ON", "OFF"]:
        raise HTTPException(status_code=400, detail={"error": "Invalid state value", "status_code": 400})
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail={"error": "Device not found", "status_code": 404})
    device.state = new_state
    db.commit()
    return {
        "deviceID": device.deviceID,
        "deviceName": device.deviceName,
        "newState": device.state,
        "updatedAt": datetime.datetime.utcnow().isoformat()
    }

@router.post("/room/{room_id}/device_register", status_code=status.HTTP_201_CREATED)
def register_device(room_id: int, device_data: DeviceRegisterSchema, db: Session = Depends(get_db)):
    # Kiểm tra xem phòng (room) có tồn tại không
    room = db.query(Room).filter(Room.roomID == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail={"error": "Room not found", "status_code": 404})
    
    new_device = Device(
        deviceName=device_data.deviceName,
        state=device_data.state,
        value=device_data.value,
        type=device_data.type,
        roomID=room_id
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    return {
        "message": "Device registered successfully",
        "device": {
            "deviceID": new_device.deviceID,
            "deviceName": new_device.deviceName,
            "state": new_device.state,
            "type": new_device.type,
            "value": float(new_device.value) if new_device.value is not None else None
        }
    }
