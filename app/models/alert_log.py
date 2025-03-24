from app.models.model_import import *
import datetime

class AlertLog(Base):
    __tablename__ = "AlertLog"

    alertID = Column(Integer, primary_key=True, autoincrement=True)
    deviceID = Column(Integer, ForeignKey("Device.deviceID", ondelete="SET NULL"), nullable=True)
    deviceName = Column(String(100), nullable=False)
    alertType = Column(String(50), nullable=False)   
    alertValue = Column(String(50))                    
    alertStatus = Column(String(20), nullable=False)   
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    device = relationship("Device", back_populates="alert_logs", passive_deletes=True)
