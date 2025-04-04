// monitor.js

// Giả sử roomID và homeID đã được lưu trong localStorage
const roomID = localStorage.getItem("activeRoomID");
const homeID = localStorage.getItem("activeHomeID");

// Đối tượng lưu chart instance cho từng thiết bị numeric
const charts = {};

// -------------------------
// Hàm fetch API
// -------------------------
async function fetchRoomDevices(roomID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/room/${roomID}/devices`);
    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

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

// -------------------------
// Hàm tạo giao diện
// -------------------------
function createDashboard(devices) {
  const dashboardContainer = document.getElementById("dashboard-container");
  dashboardContainer.innerHTML = "";

  devices.forEach(device => {
    const card = document.createElement("div");
    card.className = "monitor-card col-auto";
    card.style.position = "relative"; // Cho phép vị trí con tuyệt đối

    let iconSrc = "";
    let title = device.deviceName || "Thiết bị";

    // Tùy chỉnh icon dựa trên loại và tên thiết bị
    if (device.type === "numeric") {
      if (device.deviceName.toLowerCase().includes("nhiệt độ")) {
        iconSrc = "../images/nhietdo.png";
      } else if (device.deviceName.toLowerCase().includes("độ ẩm")) {
        iconSrc = "../images/doam.png";
      } else if (device.deviceName.toLowerCase().includes("quạt")) {
        iconSrc = "../images/fan.png";
      } else if (device.deviceName.toLowerCase().includes("ánh sáng")) {
        iconSrc = "../images/anhsang.png";
      } else {
        iconSrc = "../images/default.png";
      }
    } else {
      if (device.deviceName.toLowerCase().includes("đèn")) {
        iconSrc = "../images/led.png";
      } else if (device.deviceName.toLowerCase().includes("cửa")) {
        iconSrc = "../images/door.png";
      } else {
        iconSrc = "../images/default.png";
      }
    }

    // Nút xóa đặt ở góc bên phải phía trên
    const deleteButton = `<button class="btn btn-danger btn-sm" style="position: absolute; top: 5px; right: 5px;" onclick="deleteDevice(${device.deviceID})">
                              <i class="fas fa-trash-alt"></i>
                           </button>`;

    // Nút điều chỉnh: chỉ hiển thị nếu tên thiết bị không chứa "cảm biến"
    let controlButton = "";
    if (!device.deviceName.toLowerCase().includes("cảm biến")) {
      controlButton = `<button class="btn btn-primary btn-sm mt-2" onclick="controlDevice(${device.deviceID})">
                           <i class="fas fa-cogs"></i> Điều chỉnh
                        </button>`;
    }

    card.innerHTML = `
      ${deleteButton}
      <img src="${iconSrc}" alt="${title}" class="monitor-icon" />
      <h3>${title}</h3>
      <h1 id="device-${device.deviceID}" class="mt-4" style="font-size:1.5rem">--</h1>
      <div class="mt-2">
        ${controlButton}
      </div>
    `;
    dashboardContainer.appendChild(card);
  });
}

function createChartSection(devices) {
  const chartSection = document.getElementById("chart-section");
  chartSection.innerHTML = "<h4 class='text-center'>Biểu đồ các thiết bị Numeric</h4>";

  // Lọc các thiết bị numeric
  const numericDevices = devices.filter(device => device.type === "numeric");
  numericDevices.forEach(device => {
    const container = document.createElement("div");
    container.className = "chart-container mb-3";
    container.innerHTML = `<canvas id="chart-device-${device.deviceID}"></canvas>`;
    chartSection.appendChild(container);
  });
}

// -------------------------
// Hàm cập nhật dữ liệu và vẽ chart
// -------------------------
async function updateNumericDeviceValue(device) {
  const url = `http://127.0.0.1:8000/device/${device.deviceID}/data/last`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch numeric data for ${device.feedName}`);
    }
    const data = await response.json();
    document.getElementById(`device-${device.deviceID}`).textContent = data.value;
  } catch (error) {
    console.error("Error updating numeric device value:", error);
    document.getElementById(`device-${device.deviceID}`).textContent = "--";
  }
}

async function drawChartForDevice(device) {
  const url = `http://127.0.0.1:8000/device/${device.deviceID}/data/history?limit=20`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch history for feed ${device.feedName}`);
    }
    const dataArray = await response.json();
    if (!dataArray || dataArray.length === 0) return;

    dataArray.reverse();
    const labels = dataArray.map(d => d.created_at ? d.created_at.substring(11, 16) : "unknown");
    const values = dataArray.map(d => parseFloat(d.value));

    const canvas = document.getElementById(`chart-device-${device.deviceID}`);
    if (!canvas) {
      console.error(`Canvas for device ${device.deviceID} not found.`);
      return;
    }
    const ctx = canvas.getContext("2d");
    charts[device.deviceID] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: device.deviceName,
          data: values,
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Lịch sử ${device.deviceName}`,
            font: { size: 18 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Thời gian", font: { size: 14 } },
            ticks: { font: { size: 12 } }
          },
          y: {
            title: { display: true, text: "Giá trị", font: { size: 14 } },
            ticks: { font: { size: 12 } }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error drawing chart for device", device.deviceID, error);
  }
}

async function updateNonNumericDevice(device) {
  const url = `http://127.0.0.1:8000/device/${device.deviceID}/data/last`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch non-numeric data for ${device.feedName}`);
    }
    const data = await response.json();
    document.getElementById(`device-${device.deviceID}`).textContent = data.value;
  } catch (error) {
    console.error("Error updating non-numeric device:", error);
    document.getElementById(`device-${device.deviceID}`).textContent = "--";
  }
}

async function updateAllDeviceValues(devices) {
  for (const device of devices) {
    if (device.type === "numeric") {
      await updateNumericDeviceValue(device);
    } else {
      await updateNonNumericDevice(device);
    }
  }
}

async function drawChartsForNumericDevices(devices) {
  const numericDevices = devices.filter(device => device.type === "numeric");
  for (const device of numericDevices) {
    await drawChartForDevice(device);
  }
}

// -------------------------
// Hàm điều chỉnh thiết bị
// -------------------------
async function controlDevice(deviceID) {
  const command = prompt("Nhập lệnh điều chỉnh (ví dụ: ON hoặc OFF):");
  if (!command) return;

  const userID = localStorage.getItem("userID");
  if (!userID) {
    alert("Không xác định được user. Vui lòng đăng nhập lại.");
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/device/${deviceID}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: command, user_id: parseInt(userID) })
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.detail || "Điều chỉnh thiết bị thất bại.");
      return;
    }
    alert("Điều chỉnh thiết bị thành công!");
  } catch (error) {
    console.error("Error controlling device:", error);
    alert("Có lỗi xảy ra khi điều chỉnh thiết bị.");
  }
}

// -------------------------
// Hàm xóa thiết bị
// -------------------------
async function deleteDevice(deviceID) {
  if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
  const userID = localStorage.getItem("userID");
  if (!userID) {
    alert("Không xác định được user. Vui lòng đăng nhập lại.");
    return;
  }
  try {
    const response = await fetch(`http://127.0.0.1:8000/device/${deviceID}/delete?user_id=${userID}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const result = await response.json();
      alert(result.detail || "Xóa thiết bị thất bại.");
      return;
    }
    alert("Xóa thiết bị thành công!");
    const devices = await fetchRoomDevices(roomID);
    createDashboard(devices);
    drawChartsForNumericDevices(devices);
  } catch (error) {
    console.error("Error deleting device:", error);
    alert("Có lỗi xảy ra khi xóa thiết bị.");
  }
}


// -------------------------
// Hàm đăng ký thiết bị mới
// -------------------------
document.getElementById("registerDeviceForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const deviceName = document.getElementById("deviceName").value.trim();
  const deviceType = document.getElementById("deviceType").value;
  const feedName = document.getElementById("feedName").value.trim();

  if (!deviceName || !deviceType || !feedName) {
    showDeviceFeedback("Vui lòng nhập đầy đủ thông tin.", true);
    return;
  }

  const userID = localStorage.getItem("userID");
  if (!userID) {
    showDeviceFeedback("Không xác định được user. Vui lòng đăng nhập lại.", true);
    return;
  }

  const payload = { deviceName, type: deviceType, feedName };

  try {
    const response = await fetch(`http://127.0.0.1:8000/room/${roomID}/device_register?user_id=${userID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      showDeviceFeedback(result.detail || "Đăng ký thiết bị thất bại.", true);
      return;
    }
    showDeviceFeedback(result.message, false);
    // Reload lại danh sách thiết bị
    const devices = await fetchRoomDevices(roomID);
    createDashboard(devices);
    createChartSection(devices);
    updateAllDeviceValues(devices);
    drawChartsForNumericDevices(devices);
  } catch (error) {
    console.error("Error registering device:", error);
    showDeviceFeedback("Có lỗi xảy ra, vui lòng thử lại sau.", true);
  }
});

// Hàm hiển thị feedback cho đăng ký thiết bị
function showDeviceFeedback(message, isError = true) {
  const feedbackDiv = document.getElementById("deviceFeedback");
  feedbackDiv.classList.remove("feedback-error", "feedback-success");
  feedbackDiv.classList.add(isError ? "feedback-error" : "feedback-success");
  feedbackDiv.textContent = message;
  feedbackDiv.style.display = "block";
  setTimeout(() => {
    feedbackDiv.style.display = "none";
  }, 5000);
}

// -------------------------
// Main: Khi trang load, cập nhật giao diện
// -------------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (!roomID || !homeID) {
    console.error("Không xác định được phòng hoặc nhà. Vui lòng chọn lại.");
    return;
  }

  // Cập nhật thông tin vị trí
  const homeInfo = await fetchHomeInfo(homeID);
  const roomInfo = await fetchRoomInfo(roomID);

  const homeInfoSpan = document.getElementById("home-info");
  const roomInfoSpan = document.getElementById("room-info");
  if (homeInfo && homeInfo.address) {
    homeInfoSpan.textContent = `Nhà: ${homeInfo.address}`;
  }
  if (roomInfo && roomInfo.nameRoom) {
    roomInfoSpan.textContent = `Phòng: ${roomInfo.nameRoom}`;
  }

  // Tải danh sách thiết bị, hiển thị dashboard, chart và cập nhật giá trị
  const devices = await fetchRoomDevices(roomID);
  createDashboard(devices);
  createChartSection(devices);
  updateAllDeviceValues(devices);
  drawChartsForNumericDevices(devices);
  setInterval(() => updateAllDeviceValues(devices), 5000);
});
