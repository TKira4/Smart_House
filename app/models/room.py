from app.models.model_import import *

class Room(Base):
    __tablename__ = "Room"

    roomID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nameRoom = Column(String(100), nullable=False)
    homeID = Column(Integer, ForeignKey("Home.homeID"), nullable=False)

    home = relationship("Home", back_populates="rooms")
    devices = relationship("Device", back_populates="room", cascade="all, delete-orphan")
