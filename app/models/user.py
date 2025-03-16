from app.models.model_import import *

class User(Base):
    __tablename__ = "User"

    userID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fName = Column(String(50), nullable=False)
    lName = Column(String(50), nullable=False)
    userName = Column(String(50), nullable=False, unique=True)
    contactInfo = Column(String(100), nullable=True)
    phoneNumber = Column(String(20), nullable=True)
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    address = Column(String(255), nullable=True)
    activeHomeID = Column(Integer, ForeignKey("Home.homeID"), nullable=True)

    active_home = relationship("Home", foreign_keys=[activeHomeID])
