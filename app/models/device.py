from app.models.model_import import *

class Device(Base):
    __tablename__ = "Device"

    deviceID = Column(Integer, primary_key=True, autoincrement=True)
    deviceName = Column(String(100), nullable=False)
    state = Column(String(20), nullable=False)  # Ví dụ: 'ON', 'OFF'
    value = Column(DECIMAL(10, 2), nullable=True)  # Nếu cần lưu giá trị đo được
    type = Column(String(50), nullable=False)
    roomID = Column(Integer, ForeignKey("Room.roomID"), nullable=False)

    # Relationship: mỗi Device thuộc về một Room
    room = relationship("Room", back_populates="devices")
    alert_logs = relationship("AlertLog", back_populates="device")
    action_logs = relationship("ActionLog", back_populates="device")
    feedName = Column(String(100), nullable=False)

