from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import datetime
from app.core.database import SessionLocal
from app.models.action_log import ActionLog

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/device/{device_id}/actions", response_model=list)
def get_device_actions(device_id: int, db: Session = Depends(get_db)):
    actions = db.query(ActionLog).filter(ActionLog.deviceID == device_id).order_by(ActionLog.timestamp.desc()).all()
    if not actions:
        raise HTTPException(status_code=404, detail={"error": "No action logs found for this device", "status_code": 404})
    return [{
        "actionID": a.actionID,
        "userID": a.userID,
        "actionType": a.actionType,
        "timestamp": a.timestamp.isoformat() if isinstance(a.timestamp, datetime.datetime) else str(a.timestamp)
    } for a in actions]
