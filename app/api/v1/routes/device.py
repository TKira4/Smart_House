from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import datetime
from pydantic import BaseModel
from app.core.database import SessionLocal
from app.core.adafruit_client import *
from app.models.device import Device
from app.models.room import Room
from app.models.action_log import ActionLog

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
    state: str = "OFF"          
    value: float | None = None   
    type: str                  
    feedName: str   

#############################
# GET: Lấy danh sách thiết bị thuộc phòng
#############################
@router.get("/room/{room_id}/devices", response_model=list)
def get_devices_in_room(room_id: int, db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.roomID == room_id).all()
    if not devices:
        raise HTTPException(status_code=404, detail={"error": "No devices found in this room", "status_code": 404})

    result = []
    for d in devices:
        if d.type == "numeric":
            try:
                device_value = float(d.value) if d.value is not None else None
            except ValueError:
                device_value = None
        else:
            device_value = d.value

        result.append({
            "deviceID": d.deviceID,
            "deviceName": d.deviceName,
            "state": d.state,
            "type": d.type,
            "value": device_value,
            "feedName": d.feedName,
            "threshold": d.threshold
        })

    return result

#############################
# POST: Đăng ký thiết bị
#############################
@router.post("/room/{room_id}/device_register", status_code=status.HTTP_201_CREATED)
def register_device(room_id: int, device_data: DeviceRegisterSchema, user_id: int = Query(...), db: Session = Depends(get_db)):
    # Kiểm tra xem phòng có tồn tại không
    room = db.query(Room).filter(Room.roomID == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail={"error": "Room not found"})

    new_device = Device(
        deviceName=device_data.deviceName,
        state=device_data.state,
        value=device_data.value,
        type=device_data.type,
        roomID=room_id,
        feedName=device_data.feedName
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    # Tạo Action Log cho việc đăng ký thiết bị
    new_action = ActionLog(
        userID=user_id,
        deviceID=new_device.deviceID,
        deviceName=new_device.deviceName,  
        actionType="Register Device",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_action)
    db.commit()
    
    return {
        "message": "Device registered successfully",
        "device": {
            "deviceID": new_device.deviceID,
            "deviceName": new_device.deviceName,
            "state": new_device.state,
            "type": new_device.type,
            "value": float(new_device.value) if new_device.value is not None else None,
            "feedName": new_device.feedName,
            "threshold": new_device.threshold
        }
    }

#############################
# POST: Điều khiển thiết bị
#############################
class ControlSchema(BaseModel):
    command: str
    user_id: int

@router.post("/device/{device_id}/control", status_code=status.HTTP_200_OK)
def control_device_by_id(device_id: int, control: ControlSchema, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not device.feedName:
        raise HTTPException(status_code=400, detail="This device does not have feedName set")

    # Gọi hàm control_device từ module adafruit_client
    status_code, response_data = control_device(device.feedName, control.command)
    if status_code not in [200, 201]:
        raise HTTPException(status_code=status_code, detail=response_data)
    
    # Tạo Action Log cho thao tác điều khiển
    new_action = ActionLog(
        userID=control.user_id,
        deviceID=device_id,
        deviceName=device.deviceName if device.deviceName is not None else "Unknown Device",
        actionType=f"Control Device: {control.command}",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_action)
    db.commit()
    
    return {
        "message": f"Device {device.deviceName} control command sent successfully",
        "data": response_data
    }
    
#############################
# DELETE: Xóa thiết bị
#############################
@router.delete("/device/{device_id}/delete", status_code=status.HTTP_200_OK)
def delete_device(device_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Xóa thiết bị theo device_id và tạo Action Log cho thao tác xóa.
    Các log sẽ vẫn được giữ lại.
    """
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_name = device.deviceName if device.deviceName is not None else "Unknown Device"
    
    # Tạo Action Log cho việc xóa thiết bị
    new_action = ActionLog(
        userID=user_id,
        deviceID=device_id,
        deviceName=device_name,
        actionType="Delete Device",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_action)
    db.commit()
    
    db.delete(device)
    db.commit()
    
    return {"message": f"Device {device_name} deleted successfully"}

#############################
# GET: Lấy threshold của thiết bị
#############################
@router.get("/device/{device_id}/threshold")
def get_device_threshold(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"device_id": device.deviceID, "threshold": device.threshold}

#############################
# PUT: Cập nhật threshold cho thiết bị
#############################
class ThresholdUpdateSchema(BaseModel):
    new_threshold: float
    user_id: int

@router.put("/device/{device_id}/threshold")
def update_device_threshold(device_id: int, update_data: ThresholdUpdateSchema, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.threshold = update_data.new_threshold
    db.commit()
    db.refresh(device)

    # Tạo Action Log cho cập nhật threshold
    new_action = ActionLog(
        userID=update_data.user_id,
        deviceID=device_id,
        deviceName=device.deviceName if device.deviceName is not None else "Unknown Device",
        actionType="Update Threshold",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_action)
    db.commit()

    return {
        "message": "Threshold updated successfully",
        "device_id": device.deviceID,
        "new_threshold": device.threshold
    }

#############################
# GET: Lấy dữ liệu mới nhất của thiết bị
#############################
@router.get("/device/{device_id}/data/last")
def get_device_last_data(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if not device.feedName:
        raise HTTPException(status_code=400, detail="FeedName not set for this device")
    try:
        data = get_last_data(device.feedName)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data from Adafruit: {str(e)}")

#############################
# GET: Lấy lịch sử dữ liệu của thiết bị
#############################
@router.get("/device/{device_id}/data/history")
def get_device_history(device_id: int, limit: int = 20, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if not device.feedName:
        raise HTTPException(status_code=400, detail="FeedName not set for this device")
    try:
        history = get_feed_history(device.feedName, limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history from Adafruit: {str(e)}")
