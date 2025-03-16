from app.models.model_import import *

class Device(Base):
    __tablename__ = "Device"

    deviceID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deviceName = Column(String(100), nullable=False)
    state = Column(String(20), nullable=False, default="OFF")
    value = Column(String(50), nullable=True)
    type = Column(String(50), nullable=False)
    roomID = Column(Integer, ForeignKey("Room.roomID"), nullable=False)

    room = relationship("Room", back_populates="devices")

