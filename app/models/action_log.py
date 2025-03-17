from app.models.model_import import *

class ActionLog(Base):
    __tablename__ = "ActionLog"

    actionID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, ForeignKey("User.userID"), nullable=False)
    deviceID = Column(Integer, ForeignKey("Device.deviceID"), nullable=False)
    actionType = Column(String(50), nullable=False)  # Ví dụ: 'Adjust Alert Level', 'Reset'
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Relationship: mỗi ActionLog liên kết với một User và một Device
    user = relationship("User", back_populates="actions")
    device = relationship("Device", back_populates="action_logs")