from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import SessionLocal
from app.models.action_log import ActionLog

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/action_logs")
def get_action_logs(
    user_id: int,
    from_date: str = Query(None),
    to_date: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ActionLog).filter(ActionLog.userID == user_id)

    if from_date and to_date:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d")
        to_dt = to_dt.replace(hour=23, minute=59, second=59)
        query = query.filter(ActionLog.timestamp >= from_dt, ActionLog.timestamp <= to_dt)

    logs = query.all()
    if not logs:
        raise HTTPException(status_code=404, detail="No action logs found")

    return [{
        "actionID": log.actionID,
        "userID": log.userID,
        "deviceID": log.deviceID,
        "deviceName": log.deviceName if log.deviceName is not None else "-",
        "actionType": log.actionType,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None
    } for log in logs]
