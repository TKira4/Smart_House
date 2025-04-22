# Smart_House
Hệ thống chống cháy nổ cho ngôi nhà thông minh

# Tạo môi trường và cài thư viện
```basg
py -m venv venv                     # Tạo môi trường ảo
.\venv\Scripts\activate             # dir venv
pip install -r .\requirements.txt   # Cài các thư viện cần thiết
```
# Lệnh chạy src
```basg
uvicorn app.main:app --reload
```

# Lệnh chạy tạo bảng database
```basg
py -B -m app.core.create_db
```

# Cấu trúc thư mục
```plaintext
smart_house/
│
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── user.py         # API quản lý người dùng
│   │   │   │   ├── home.py         # API quản lý nhà thông minh
│   │   │   │   ├── room.py         # API quản lý phòng
│   │   │   │   ├── device.py       # API nhận dữ liệu thiết bị
│   │   │   │   ├── alert_log.py    # API xem log cảnh báo
│   │   │   │   ├── action_log.py   # API xem log hành động
│   │   │   ├── __init__.py
│   │   ├── __init__.py
│   │
│   ├── core/
│   │   ├── config.py        # Cấu hình chung (DB, MQTT, API key)
│   │   ├── database.py      # Kết nối với MySQL bằng SQLAlchemy
│   │   ├── observer.py      # Cài đặt Observer Pattern
│   │   ├── mqtt.py          # Xử lý kết nối MQTT
│   │   └── __init__.py
│   │
│   ├── models/
│   │   ├── __init__.py       # Import chung cho module models
│   │   ├── base.py           # Chứa Base và database config
│   │   ├── user.py           # Model User
│   │   ├── home.py           # Model Home
│   │   ├── room.py           # Model Room
│   │   ├── device.py         # Model Device
│   │   ├── alert_log.py      # Model AlertLog
│   │   ├── action_log.py     # Model ActionLog
│   │   ├── model_import.py   # Chứa import chung
│   │
│   ├── services/
│   │   ├── user_service.py    # Xử lý logic người dùng
│   │   ├── home_service.py    # Xử lý logic nhà thông minh
│   │   ├── room_service.py    # Xử lý logic phòng
│   │   ├── device_service.py  # Xử lý logic thiết bị
│   │   ├── log_service.py     # Xử lý logic log
│   │   ├── __init__.py
│   │
│   ├── main.py           # Entry point chính của FastAPI
│   ├── __init__.py
│
├── tests/                # Chứa các file test
│   ├── test_user.py
│   ├── test_home.py
│   ├── test_room.py
│   ├── test_device.py
│   ├── test_log.py
│   ├── __init__.py
│
├── requirements.txt      # Danh sách thư viện cần cài đặt
├── .env                  # File chứa cấu hình bảo mật (DB URL, MQTT broker)
└── README.md             # Hướng dẫn cài đặt & sử dụng

```