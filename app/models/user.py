from app.models.model_import import *

class User(Base):
    __tablename__ = "User"

    userID = Column(Integer, primary_key=True, autoincrement=True)
    fName = Column(String(50), nullable=False)
    lName = Column(String(50), nullable=False)
    userName = Column(String(50), nullable=False, unique=True)
    contactInfo = Column(String(100))
    phoneNumber = Column(String(20))
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    address = Column(String(255))
    activeHomeID = Column(Integer, ForeignKey("Home.homeID"), nullable=True)

    # Relationship: một User có thể có nhiều Home (chủ sở hữu) và các ActionLog
    active_home = relationship("Home", foreign_keys=[activeHomeID], post_update=True)
    homes = relationship("Home", back_populates="owner", foreign_keys="[Home.ownerID]")
    actions = relationship("ActionLog", back_populates="user")
