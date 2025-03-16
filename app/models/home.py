from app.models.model_import import *

class Home(Base):
    __tablename__ = "Home"

    homeID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    address = Column(String(255), nullable=False)
    ownerID = Column(Integer, ForeignKey("User.userID"), nullable=False)

    owner = relationship("User", back_populates="homes")
    rooms = relationship("Room", back_populates="home", cascade="all, delete-orphan")
