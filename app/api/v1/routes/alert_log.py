from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.alert_log import AlertLog
from app.models.device import Device
from app.models.room import Room
from app.models.home import Home
from pydantic import BaseModel
from datetime import datetime
from fastapi import Query
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/alert_logs")
def get_alert_logs(
    user_id: int,
    from_date: str = Query(None),
    to_date: str = Query(None),
    db: Session = Depends(get_db)
):
    # Lấy danh sách thiết bị thuộc về user
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

    # Truy vấn log theo danh sách device
    query = db.query(AlertLog).filter(AlertLog.deviceID.in_(device_ids))

    # Lọc thời gian nếu có
    if from_date and to_date:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query = query.filter(AlertLog.timestamp >= from_dt, AlertLog.timestamp <= to_dt)

    logs = query.all()
    if not logs:
        return []

    # Build kết quả
    result = []
    for log in logs:
        device = db.query(Device).filter(Device.deviceID == log.deviceID).first()
        result.append({
            "alertID": log.alertID,
            "deviceName": device.deviceName if device and device.deviceName else log.deviceName,
            "alertType": log.alertType,
            "alertValue": log.alertValue,
            "alertStatus": log.alertStatus,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })

    return result



# Schema để nhận từ frontend
class AlertCreateSchema(BaseModel):
    device_id: int
    alert_type: str
    alert_value: str
    alert_status: str = "Pending"  # Có thể cho mặc định
    timestamp: datetime | None = None  # Nếu không có sẽ dùng hiện tại

@router.post("/alert_logs", status_code=status.HTTP_201_CREATED)
def create_alert_log(alert_data: AlertCreateSchema, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.deviceID == alert_data.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    new_alert = AlertLog(
        deviceID=alert_data.device_id,
        alertType=alert_data.alert_type,
        alertValue=alert_data.alert_value,
        alertStatus=alert_data.alert_status,
        timestamp=alert_data.timestamp or datetime.utcnow()
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "message": "Alert log created successfully",
        "alertID": new_alert.alertID
    }