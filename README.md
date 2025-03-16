# Smart_House
Hệ thống chống cháy nổ cho ngôi nhà thông minh

# Tạo môi trường và cài thư viện
```basg
py -m venv venv     # Tạo môi trường ảo

pip install -r .\requirements.txt   # Cài các thư viện cần thiết
```

# Cấu trúc thư mục
```plaintext
smart_house/
│
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── routes/
│   │   │   │   ├── device.py       # API nhận dữ liệu thiết bị
│   │   │   │   ├── user.py         # API quản lý người dùng
│   │   │   │   ├── home.py         # API quản lý nhà thông minh
│   │   │   │   ├── log.py          # API đọc log từ database
│   │   │   │   ├── websocket.py    # WebSocket đọc dữ liệu real-time
│   │   │   └── __init__.py
│   │   └── __init__.py
│   │
│   ├── core/
│   │   ├── config.py        # Cấu hình chung (DB, MQTT, API key)
│   │   ├── database.py      # Kết nối với SQLite/MySQL bằng SQLAlchemy
│   │   ├── observer.py      # Cài đặt Observer Pattern
│   │   └── mqtt.py          # Xử lý kết nối MQTT
│   │
│   ├── models/
│   │   ├── device.py        # Model thiết bị
│   │   ├── user.py          # Model người dùng
│   │   ├── home.py          # Model nhà thông minh
│   │   ├── log.py           # Model log hệ thống
│   │   └── __init__.py
│   │
│   ├── services/
│   │   ├── device_service.py  # Xử lý logic thiết bị
│   │   ├── user_service.py    # Xử lý logic người dùng
│   │   ├── log_service.py     # Xử lý logic log
│   │   └── __init__.py
│   │
│   ├── main.py           # Entry point chính của FastAPI
│   └── __init__.py
│
├── tests/                # Chứa các file test
│   ├── test_device.py
│   ├── test_user.py
│   ├── test_log.py
│   └── __init__.py
│
├── requirements.txt      # Danh sách thư viện cần cài đặt
├── .env                  # File chứa cấu hình bảo mật (DB URL, MQTT broker)
└── README.md             # Hướng dẫn cài đặt & sử dụng
```