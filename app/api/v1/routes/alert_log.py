from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import datetime
from app.core.database import SessionLocal
from app.models.alert_log import AlertLog
from app.models.device import Device

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/room/{room_id}/alerts", response_model=list)
def get_room_alerts(room_id: int, db: Session = Depends(get_db)):
    alerts = db.query(AlertLog).join(Device).filter(Device.roomID == room_id).order_by(AlertLog.timestamp.desc()).all()
    if not alerts:
        raise HTTPException(status_code=404, detail={"error": "No monitoring data found for this room", "status_code": 404})
    return [{
        "alertID": a.alertID,
        "deviceID": a.deviceID,
        "alertType": a.alertType,
        "alertValue": a.alertValue,
        "alertStatus": a.alertStatus,
        "timestamp": a.timestamp.isoformat() if isinstance(a.timestamp, datetime.datetime) else str(a.timestamp)
    } for a in alerts]
