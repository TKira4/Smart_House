from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Tạo engine kết nối MySQL
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Tạo session để query database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base để khai báo model
Base = declarative_base()
