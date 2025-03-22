# app/api/v1/routes/action_log.py

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.action_log import ActionLog
from app.models.device import Device  # <-- Đảm bảo import Device
import datetime

router = APIRouter()

# Dependency để lấy session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/action_logs", status_code=status.HTTP_200_OK)
def get_action_logs(user_id: int, db: Session = Depends(get_db)):
    # Thực hiện join giữa ActionLog và Device để lấy deviceName
    logs = (
        db.query(ActionLog, Device.deviceName)
          .join(Device, ActionLog.deviceID == Device.deviceID)
          .filter(ActionLog.userID == user_id)
          .all()
    )
    if not logs:
        raise HTTPException(status_code=404, detail="No action logs found")
    return [
        {
            "actionID": log.ActionLog.actionID,
            "userID": log.ActionLog.userID,
            "deviceID": log.ActionLog.deviceID,
            "deviceName": log.deviceName,
            "actionType": log.ActionLog.actionType,
            "timestamp": log.ActionLog.timestamp.isoformat() if log.ActionLog.timestamp else None,
        }
        for log in logs
    ]
