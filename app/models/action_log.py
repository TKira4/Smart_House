from app.models.model_import import *
import datetime

class ActionLog(Base):
    __tablename__ = "ActionLog"

    actionID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, ForeignKey("User.userID"), nullable=False)
    deviceID = Column(Integer, ForeignKey("Device.deviceID", ondelete="SET NULL"), nullable=True)
    deviceName = Column(String(100), nullable=False)
    actionType = Column(String(50), nullable=False)  
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="actions")
    device = relationship("Device", back_populates="action_logs", passive_deletes=True)
