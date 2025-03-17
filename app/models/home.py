from app.models.model_import import *

class Home(Base):
    __tablename__ = "Home"

    homeID = Column(Integer, primary_key=True, autoincrement=True)
    address = Column(String(255), nullable=False)
    ownerID = Column(Integer, ForeignKey("User.userID"), nullable=False)

    # Relationship: mỗi Home thuộc về một User (owner) và có nhiều Room
    owner = relationship("User", back_populates="homes", foreign_keys=[ownerID])
    rooms = relationship("Room", back_populates="home")

