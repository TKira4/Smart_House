from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import datetime
from app.core.database import SessionLocal
from app.models.action_log import ActionLog
from app.models.device import Device  # Đảm bảo import Device

router = APIRouter()

# Dependency để lấy session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/action_logs")
def get_action_logs(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(ActionLog).filter(ActionLog.userID == user_id).all()
    if not logs:
        raise HTTPException(status_code=404, detail="No action logs found")
    return [{
        "actionID": log.actionID,
        "userID": log.userID,
        "deviceID": log.deviceID,
        # Nếu deviceName trong log bị None, hiển thị dấu "-"
        "deviceName": log.deviceName if log.deviceName is not None else "-",
        "actionType": log.actionType,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None
    } for log in logs]
