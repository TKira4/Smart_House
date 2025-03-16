from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.core.database import SessionLocal

def test_db_connection():
    try:
        db: Session = SessionLocal()
        db.execute(text("SELECT 1"))  # Sử dụng text() để tránh lỗi
        print("✅ Kết nối Database thành công!")
    except Exception as e:
        print(f"❌ Lỗi kết nối Database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_db_connection()
