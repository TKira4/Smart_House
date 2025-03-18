## 1. AUTH
# 1.1 Đăng ký (Sign Up)
- URL: **POST** /auth/signup
- Request Body:
```json
{
  "fName": "Ha Thai",
  "lName": "Toan",
  "email": "toan@example.com",
  "phoneNumber": "0941804142",
  "userName": "toan123",
  "password": "somePassword",
  "confirmPassword": "somePassword"
}
```
- **Response**:
    ### **201 Created** (Thành công):
  ```json
  {
    "message": "User created successfully",
    "user": {
      "userID": 1,
      "userName": "toan123",
      "email": "toan@example.com"
    }
  } 
  ```
    ### 400 Error: Bad Request
    ```json
    {
      "detail": "User with this username or email already exists."
    }
    ```
# 1.2 Đăng nhập (Login)
- URL: **POST** /auth/login
- Request Body
```json
{
  "identifier": "toan@example.com", 
  "password": "somePassword"
}
```
identifier: Có thể là userName, email hoặc phoneNumber
- Response:
### 200 OK (Thành công)
```json
{
  "message": "Login successful",
  "access_token": "JWT_TOKEN_HERE",
  "token_type": "bearer"
}
```
### 401 ERROR: Unauthorized
```json
{
  "detail": "Invalid credentials"
}
```
## 2. Trang chủ (Home)
# 2.1 Lấy danh sách home mà user sở hữu
- URL: **GET** /api/v1/user/{user_id}/homes
- Response 
### 200 OK (Thành công)
```json
[
  {
    "homeID": 1,
    "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "ownerID": 1
  },
  {
    "homeID": 2,
    "address": "456 Đà Lạt, Lâm Đồng",
    "ownerID": 1
  }
]
```
### 401 ERROR: Unauthorized
```json
{
  "error": "User has no homes registered",
  "status_code": 401
}
```
# 2.2 Đổi active home của user (nút chuyển nhà)
- URL: **PUT** /api/v1/user/{user_id}/active-home
- Request Body:
```json
{
  "activeHomeID": 2
}
```
- Response:
### 200 OK (Thành công)
```json
{
  "message": "Active home updated successfully",
  "activeHomeID": 2
}
```
# 2.3 User đăng ký Home mới (First time or New one)
- URL: **POST** /api/v1/home/register
- Request Body:
```json
{
  "user_id": 1,
  "address": "123 Nguyễn Văn Cừ, Quận 5, TP.HCM"
}
```
- Reponse:
### 200 OK (Thành công)
```json
{
  "message": "Home registered successfully",
  "home": {
    "home_id": 12,
    "address": "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    "owner_id": 1
  }
}
```
## 3. Bảng giám sát (Monitoring)
# 3.1 Lấy danh sách các phòng trong home
- URL: **GET** /api/v1/home/{home_id}/rooms
- Response:
### 200 OK (Thành công)
```json
[
  {
    "roomID": 1,
    "nameRoom": "Phòng khách"
  },
  {
    "roomID": 2,
    "nameRoom": "Phòng ngủ"
  }
]
```
### 404 ERROR: NOT FOUND
```json
{
  "error": "No rooms found in this home",
  "status_code": 404
}
```
# 3.2 Lấy thông số giám sát của phòng (thông tin device và alert)
- URL: **GET** /api/v1/room/{room_id}/monitoring
- Response:
### 200 OK (Thành công)
```json
{
  "roomID": 1,
  "nameRoom": "Phòng khách",
  "devices": [
    {
      "deviceID": 10,
      "deviceName": "Nhiệt kế",
      "state": "ON",
      "value": 27.5,
      "type": "Temperature Sensor"
    },
    {
      "deviceID": 11,
      "deviceName": "Máy lọc không khí",
      "state": "OFF",
      "type": "Air Filter"
    }
  ],
  "latestAlerts": [
    {
      "alertID": 100,
      "deviceID": 10,
      "alertType": "Temperature High",
      "alertValue": "55°C",
      "alertStatus": "Pending",
      "timestamp": "2025-03-18T10:30:00Z"
    }
  ]
}
```
### 404 ERROR: NOT FOUND
```json
{
  "error": "No monitoring data found for this room",
  "status_code": 404
}
```
## 4. Bảng điều khiển (Control)
# 4.1 Lấy danh sách thiết bị đang hoạt động trong phòng
- URL: **GET** /api/v1/room/{room_id}/devices
- Response:
### 200 OK (Thành công)
```json
[
  {
    "deviceID": 10,
    "deviceName": "Đèn LED trần",
    "state": "ON",
    "type": "Light"
  },
  {
    "deviceID": 11,
    "deviceName": "Máy lạnh",
    "state": "OFF",
    "type": "Air Conditioner"
  }
]
```
### 404 ERROR: NOT FOUND
```json
{
  "error": "No devices found in this room",
  "status_code": 404
}
```
# 4.2 Bật / tắt hoặc thay đổi trạng thái thiết bị
- URL: **PUT** /api/v1/device/{device_id}/state
- Request Body:
```json
{
  "state": "ON"     # ON/OFF dựa vào lựa chọn user
}
```
- Reponse:
### 200 OK (Thành công)
```json
{
  "deviceID": 10,
  "deviceName": "Đèn LED trần",
  "newState": "ON",
  "updatedAt": "2025-03-18T11:00:00Z"
}
```
### 400 BAD REQUEST
```json
{
  "error": "Invalid state value",
  "status_code": 400
}
```
# 4.3 Lịch sử hành động (ActionLog) theo thiết bị hoặc phòng
- URL: **GET** /api/v1/device/{device_id}/actions
- Response:
### 200 OK (Thành công)
```json
[
  {
    "actionID": 1,
    "userID": 1,
    "actionType": "Turn On",
    "timestamp": "2025-03-18T10:40:00Z"
  },
  {
    "actionID": 2,
    "userID": 1,
    "actionType": "Adjust Alert Level",
    "timestamp": "2025-03-18T10:45:00Z"
  }
]
```
### 404 ERROR: NOT FOUND
```json
{
  "error": "No action logs found for this device",
  "status_code": 404
}
```