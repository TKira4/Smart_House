from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Device(Base):
    __tablename__ = "devices"

    device_id = Column(Integer, primary_key=True, autoincrement=True)
    device_name = Column(String(100), nullable=False)
    state = Column(String(20), default="OFF")
    value = Column(Float, nullable=True)
    type = Column(String(50), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id"))

    room = relationship("Room", back_populates="devices")
