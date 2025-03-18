from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.room import Room
from app.models.device import Device
from app.models.alert_log import AlertLog
import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#trả về thiết bị và cảnh báo trong phòng
@router.get("/room/{room_id}/monitoring", response_model=dict)
def get_room_monitoring(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.roomID == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail={"error": "No monitoring data found for this room", "status_code": 404})
    devices = db.query(Device).filter(Device.roomID == room_id).all()
    alerts = db.query(AlertLog).join(Device).filter(Device.roomID == room_id).order_by(AlertLog.timestamp.desc()).limit(5).all()
    return {
        "roomID": room.roomID,
        "nameRoom": room.nameRoom,
        "devices": [{
            "deviceID": d.deviceID,
            "deviceName": d.deviceName,
            "state": d.state,
            "type": d.type,
            "value": float(d.value) if d.value is not None else None
        } for d in devices],
        "latestAlerts": [{
            "alertID": a.alertID,
            "deviceID": a.deviceID,
            "alertType": a.alertType,
            "alertValue": a.alertValue,
            "alertStatus": a.alertStatus,
            "timestamp": a.timestamp.isoformat() if isinstance(a.timestamp, datetime.datetime) else str(a.timestamp)
        } for a in alerts]
    }
