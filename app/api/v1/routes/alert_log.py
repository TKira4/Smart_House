from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.alert_log import AlertLog
from app.models.device import Device  
from app.models.room import Room
from app.models.home import Home

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/alert_logs")
def get_alert_logs(user_id: int, db: Session = Depends(get_db)):
    # Lấy danh sách thiết bị thuộc user thông qua Home và Room
    devices = (
        db.query(Device)
        .join(Room, Device.roomID == Room.roomID)
        .join(Home, Room.homeID == Home.homeID)
        .filter(Home.ownerID == user_id)
        .all()
    )
    device_ids = [d.deviceID for d in devices]

    if not device_ids:
        raise HTTPException(status_code=404, detail="User has no devices.")

    logs = (
        db.query(AlertLog)
        .filter(AlertLog.deviceID.in_(device_ids))
        .all()
    )
    if not logs:
        raise HTTPException(status_code=404, detail="No alert logs found")

    result = []
    for log in logs:
        device = db.query(Device).filter(Device.deviceID == log.deviceID).first()
        result.append({
            "alertID": log.alertID,
            "deviceName": device.deviceName if device else None,
            "alertType": log.alertType,
            "alertValue": log.alertValue,
            "alertStatus": log.alertStatus,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })
    return result

