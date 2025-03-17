from app.models.model_import import *

class AlertLog(Base):
    __tablename__ = "AlertLog"

    alertID = Column(Integer, primary_key=True, autoincrement=True)
    deviceID = Column(Integer, ForeignKey("Device.deviceID"), nullable=False)
    alertType = Column(String(50), nullable=False)   # Ví dụ: 'Temperature', 'Smoke'
    alertValue = Column(String(50))                    # Ví dụ: '55°C', '300 ppm'
    alertStatus = Column(String(20), nullable=False)   # Ví dụ: 'Pending', 'Resolved'
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Relationship: mỗi AlertLog liên kết với một Device
    device = relationship("Device", back_populates="alert_logs")

