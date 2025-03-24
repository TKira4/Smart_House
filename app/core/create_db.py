from app.core.database import Base, engine
# import model
from app.models import user, device, home, room, action_log, alert_log

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
