document.addEventListener("DOMContentLoaded", async () => {
  const roomID = localStorage.getItem("activeRoomID");
  const homeID = localStorage.getItem("activeHomeID");

  if (!roomID || !homeID) {
    console.error("Không xác định được phòng hoặc nhà. Vui lòng chọn lại.");
    return;
  }

  // Gọi API để lấy thông tin chi tiết của nhà và phòng
  const homeInfo = await fetchHomeInfo(homeID);
  const roomInfo = await fetchRoomInfo(roomID);

  // Cập nhật giao diện hiển thị thông tin vị trí
  const homeInfoSpan = document.getElementById("home-info");
  const roomInfoSpan = document.getElementById("room-info");
  if (homeInfo && homeInfo.address) {
    homeInfoSpan.textContent = `Nhà: ${homeInfo.address}`;
  }
  if (roomInfo && roomInfo.nameRoom) {
    roomInfoSpan.textContent = `Phòng: ${roomInfo.nameRoom}`;
  }
  // Fetch thiết bị của phòng
  const devices = await fetchRoomDevices(roomID);
  const sensorDevices = devices.filter(device =>
    device.deviceName.toLowerCase().includes("cảm biến")
  );
  createSettingsCards(sensorDevices);

  // Fetch log theo user (giả sử userID đã được lưu)
  const userID = localStorage.getItem("userID");
  if (userID) {
    fetchActionLogs(userID);
    fetchAlertLogs(userID);
  }
});

async function fetchHomeInfo(homeID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/home/${homeID}`);
    if (!response.ok) throw new Error("Failed to fetch home info");
    return await response.json();
  } catch (error) {
    console.error("Error fetching home info:", error);
    return null;
  }
}

async function fetchRoomInfo(roomID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/room/${roomID}`);
    if (!response.ok) throw new Error("Failed to fetch room info");
    return await response.json();
  } catch (error) {
    console.error("Error fetching room info:", error);
    return null;
  }
}

// Hàm fetch thiết bị của phòng từ API
async function fetchRoomDevices(roomID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/room/${roomID}/devices`);
    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }
    const data = await response.json();
    console.log("Devices fetched:", data);
    return data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

// Hàm tạo card cài đặt threshold cho thiết bị sensor
function createSettingsCards(devices) {
  const container = document.getElementById("thresholdContainer");
  container.innerHTML = "";

  if (devices.length === 0) {
    container.innerHTML = "<p>Không có thiết bị cảm biến nào được đăng ký.</p>";
    return;
  }

  const rowDiv = document.createElement("div");
  rowDiv.className = "sensor-card-container";

  devices.forEach(device => {
    const card = document.createElement("div");
    card.className = "monitor-card";
    card.style.position = "relative";

    // Tùy chỉnh icon dựa trên tên thiết bị
    let iconSrc = "../images/default.png";
    const lowerName = device.deviceName.toLowerCase();
    if (lowerName.includes("nhiệt độ")) {
      iconSrc = "../images/nhietdo.png";
    } else if (lowerName.includes("độ ẩm")) {
      iconSrc = "../images/doam.png";
    } else if (lowerName.includes("ánh sáng")) {
      iconSrc = "../images/anhsang.png";
    } else if (lowerName.includes("cảm biến")) {
      iconSrc = "../images/cambien.png";
    }

    const deleteButton = `<button class="btn btn-danger btn-sm" style="position: absolute; top:5px; right:5px;" onclick="deleteDevice(${device.deviceID})">
                              <i class="fas fa-trash-alt"></i>
                            </button>`;

    const currentThreshold = (device.threshold !== undefined && device.threshold !== null)
                              ? device.threshold 
                              : "Chưa cài đặt";

    card.innerHTML = `
      ${deleteButton}
      <img src="${iconSrc}" alt="${device.deviceName}" class="monitor-icon" />
      <h3>${device.deviceName}</h3>
      <p>Ngưỡng hiện tại: <span id="current-threshold-${device.deviceID}">${currentThreshold}</span></p>
      <input type="number" class="form-control" id="input-threshold-${device.deviceID}" placeholder="Nhập ngưỡng mới" />
      <button class="btn btn-success btn-sm mt-2" onclick="updateThreshold(${device.deviceID})">
        Cập nhật
      </button>
    `;

    rowDiv.appendChild(card);
  });

  container.appendChild(rowDiv);
}


// Hàm cập nhật threshold cho một thiết bị (sử dụng body JSON, truyền user_id)
async function updateThreshold(deviceID) {
  const input = document.getElementById(`input-threshold-${deviceID}`);
  const newThreshold = parseFloat(input.value);
  if (isNaN(newThreshold)) {
    alert("Vui lòng nhập giá trị số hợp lệ cho ngưỡng.");
    return;
  }
  const userID = localStorage.getItem("userID");
  if (!userID) {
    alert("Không xác định được user. Vui lòng đăng nhập lại.");
    return;
  }
  try {
    const response = await fetch(`http://127.0.0.1:8000/device/${deviceID}/threshold`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        new_threshold: newThreshold,
        user_id: parseInt(userID)
      })
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.detail || "Cập nhật ngưỡng thất bại.");
      return;
    }
    document.getElementById(`current-threshold-${deviceID}`).textContent = newThreshold;
    alert("Cập nhật ngưỡng thành công!");
  } catch (error) {
    console.error("Error updating threshold:", error);
    alert("Có lỗi xảy ra, vui lòng thử lại sau.");
  }
}


// Hàm xóa thiết bị
async function deleteDevice(deviceID) {
  if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
  try {
    const response = await fetch(`http://127.0.0.1:8000/device/${deviceID}/delete`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const result = await response.json();
      alert(result.detail || "Xóa thiết bị thất bại.");
      return;
    }
    alert("Xóa thiết bị thành công!");
    // Reload danh sách thiết bị
    const roomID = localStorage.getItem("activeRoomID");
    const devices = await fetchRoomDevices(roomID);
    // Lọc các thiết bị cảm biến
    const sensorDevices = devices.filter(device => device.deviceName.toLowerCase().includes("cảm biến"));
    createSettingsCards(sensorDevices);
  } catch (error) {
    console.error("Error deleting device:", error);
    alert("Có lỗi xảy ra khi xóa thiết bị.");
  }
}

// Fetch lịch sử hành động
async function fetchActionLogs(userID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/action_logs?user_id=${userID}`);
    if (!response.ok) {
      throw new Error("Failed to fetch action logs");
    }
    const logs = await response.json();
    populateActionLogs(logs);
  } catch (error) {
    console.error("Error fetching action logs:", error);
  }
}

// Hiển thị lịch sử hành động
function populateActionLogs(logs) {
  const tableBody = document.getElementById("actionLogTable").querySelector("tbody");
  tableBody.innerHTML = "";
  if (!logs.length) {
    tableBody.innerHTML = "<tr><td colspan='5'>Không có lịch sử hành động nào.</td></tr>";
    return;
  }
  logs.forEach(log => {
    tableBody.innerHTML += `
      <tr>
        <td>${log.actionID}</td>
        <td>${log.userID}</td>
        <td>${log.deviceName || "-"}</td>
        <td>${log.actionType}</td>
        <td>${log.timestamp}</td>
      </tr>
    `;
  });
}

// Fetch lịch sử cảnh báo
async function fetchAlertLogs(userID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/alert_logs?user_id=${userID}`);
    if (!response.ok) {
      throw new Error("Failed to fetch alert logs");
    }
    const logs = await response.json();
    populateAlertLogs(logs);
  } catch (error) {
    console.error("Error fetching alert logs:", error);
  }
}

// Hiển thị lịch sử cảnh báo
function populateAlertLogs(logs) {
  const tableBody = document.getElementById("alertLogTable").querySelector("tbody");
  tableBody.innerHTML = "";
  if (!logs.length) {
    tableBody.innerHTML = "<tr><td colspan='6'>Không có lịch sử cảnh báo nào.</td></tr>";
    return;
  }
  logs.forEach(log => {
    tableBody.innerHTML += `
      <tr>
        <td>${log.alertID}</td>
        <td>${log.deviceName || "-"}</td>
        <td>${log.alertType}</td>
        <td>${log.alertValue}</td>
        <td>${log.alertStatus}</td>
        <td>${log.timestamp}</td>
      </tr>
    `;
  });
}
