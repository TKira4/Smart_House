from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import datetime
from pydantic import BaseModel
from app.core.database import SessionLocal
from app.core.adafruit_client import control_device  # Hàm này gửi lệnh qua REST API tới Adafruit IO
from app.models.device import Device
from app.models.room import Room

router = APIRouter()

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
    state: str = "OFF"          # Mặc định là OFF
    value: float | None = None   # Nếu cần lưu giá trị đo được
    type: str                   # Ví dụ: "Light", "Temperature Sensor", ...
    feedName: str   


#############################
# GET: Lấy danh sách thiết bị thuộc phòng
#############################
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

@router.post("/room/{room_id}/device_register", status_code=status.HTTP_201_CREATED)
def register_device(room_id: int, device_data: DeviceRegisterSchema, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.roomID == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail={"error": "Room not found"})

    new_device = Device(
        deviceName=device_data.deviceName,
        state=device_data.state,
        value=device_data.value,
        type=device_data.type,
        roomID=room_id,
        feedName=device_data.feedName  # Lưu feedName vào DB
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
            "value": float(new_device.value) if new_device.value is not None else None,
            "feedName": new_device.feedName
        }
    }

@router.post("/device/{device_id}/control")
def control_device_by_id(device_id: int, command: str, db: Session = Depends(get_db)):
    """
    Điều khiển thiết bị qua Adafruit IO, dựa trên device_id.
    Sẽ lấy feedName từ DB, rồi gửi lệnh command lên feed.
    """
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not device.feedName:
        raise HTTPException(status_code=400, detail="This device does not have feedName set")

    # Gọi hàm control_device (Adafruit IO)
    status_code, response_data = control_device(device.feedName, command)
    if status_code not in [200, 201]:
        raise HTTPException(status_code=status_code, detail=response_data)

    return {
        "message": f"Device {device.deviceName} control command sent successfully",
        "data": response_data
    }