from app.models.model_import import *

class AlertLog(Base):
    __tablename__ = "AlertLog"

    alertID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deviceID = Column(Integer, ForeignKey("Device.deviceID"), nullable=False)
    alertType = Column(String(50), nullable=False)
    alertValue = Column(String(50), nullable=True)
    alertStatus = Column(String(20), nullable=False, default="Pending")
    timestamp = Column(String(50), nullable=False)

    device = relationship("Device")
