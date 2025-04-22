// monitor.js

// Hàm lấy tham số từ URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Hàm hiển thị thông báo
function showRoomFeedback(message, isError = true) {
  const feedbackDiv = document.getElementById("roomFeedback");
  feedbackDiv.classList.remove("feedback-error", "feedback-success");
  feedbackDiv.classList.add(isError ? "feedback-error" : "feedback-success");
  feedbackDiv.textContent = message;
  feedbackDiv.style.display = "block";
  setTimeout(() => {
    feedbackDiv.style.display = "none";
  }, 5000);
}

// Fetch danh sách phòng
function fetchRooms(homeID) {
  fetch(`http://127.0.0.1:8000/home/${homeID}/rooms`)
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch rooms");
      return response.json();
    })
    .then((data) => displayRoomList(data))
    .catch((error) => {
      console.error("Error fetching room list:", error);
      document.getElementById("roomList").innerHTML =
        "<p>Lỗi khi tải danh sách phòng.</p>";
    });
}

// Hiển thị danh sách phòng
function displayRoomList(rooms) {
  const roomListDiv = document.getElementById("roomList");
  roomListDiv.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    roomListDiv.innerHTML = "<p>Không có phòng nào được đăng ký.</p>";
    return;
  }

  rooms.forEach((room) => {
    const card = document.createElement("div");
    card.className = "monitor-card";
    card.style.position = "relative";

    let iconSrc = "../images/room.png";
    const lowerName = room.nameRoom.toLowerCase();
    if (lowerName.includes("tắm")) iconSrc = "../images/bathroom.png";
    else if (lowerName.includes("khách")) iconSrc = "../images/livingroom.png";
    else if (lowerName.includes("ngủ")) iconSrc = "../images/bedroom.png";

    const deleteButton = `
      <button class="btn btn-danger btn-sm" style="position:absolute; top:5px; right:5px;"
              onclick="deleteRoom(${room.roomID})">
        <i class="fas fa-trash-alt"></i>
      </button>`;

    const chooseButton = `
      <button class="btn btn-primary mt-2" onclick="selectRoom(${room.roomID})">
        Chọn phòng
      </button>`;

    card.innerHTML = `
      ${deleteButton}
      <img src="${iconSrc}" alt="${room.nameRoom}" class="monitor-icon" />
      <h3>${room.nameRoom}</h3>
      <p>Room ID: ${room.roomID}</p>
      ${chooseButton}
    `;

    roomListDiv.appendChild(card);
  });
}

// Chọn phòng
function selectRoom(roomID) {
  localStorage.setItem("activeRoomID", roomID);
  window.location.href = "monitor.html";
}

// Xóa phòng
async function deleteRoom(roomID) {
  if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
  const homeID = getQueryParam("home_id") || localStorage.getItem("activeHomeID");
  if (!homeID) {
    alert("Không xác định được home. Vui lòng quay lại trang chủ và chọn nhà.");
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/home/${homeID}/room_delete/${roomID}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      const result = await response.json();
      alert(result.detail || "Xóa phòng thất bại.");
      return;
    }
    alert("Phòng đã được xóa.");
    fetchRooms(homeID);
  } catch (error) {
    console.error("Error deleting room:", error);
    alert("Có lỗi xảy ra khi xóa phòng.");
  }
}

// Hàm vẽ các biểu đồ cho thiết bị trong phòng
async function drawRoomDeviceCharts(devices) {
  const container = document.getElementById("individualChartsContainer");
  container.innerHTML = "";

  // Lấy giá trị ngày từ input
  const fromDate = document.getElementById("from-date")?.value;
  const toDate   = document.getElementById("to-date")?.value;

  // Lọc chỉ lấy thiết bị numeric
  const filtered = devices.filter((d) => d.type === "numeric");

  for (const device of filtered) {
    const chartWrapper = document.createElement("div");
    chartWrapper.className = "chart-container mb-4";
    chartWrapper.innerHTML = `
      <h5>${device.deviceName} (${device.roomName})</h5>
      <canvas id="chart-${device.deviceID}" height="200"></canvas>
    `;
    container.appendChild(chartWrapper);
    await renderDeviceChart(device, fromDate, toDate);
  }
}

async function renderDeviceChart(device, fromDate = "", toDate = "") {
  // 1. Xây URL
  let url = `http://127.0.0.1:8000/device/${device.deviceID}/data/history?limit=20`;
  if (fromDate) url += `&from_date=${fromDate}`;
  if (toDate)   url += `&to_date=${toDate}`;

  // 2. Gọi API
  let data = [];
  try {
    const response = await fetch(url);
    if (response.ok) data = await response.json();
  } catch (e) {
    console.error(`Failed to fetch history for device ${device.deviceID}`, e);
  }

  // 3. Lấy context của canvas
  const canvas = document.getElementById(`chart-${device.deviceID}`);
  const ctx = canvas.getContext("2d");

  // 4. Chuẩn bị labels và values (dù mảng rỗng)
  const labels = data.map(d => d.created_at.substring(11, 16));
  const values = data.map(d => parseFloat(d.value));

  // 5. Nếu đã có chart trước đó, hủy nó để tránh vẽ đè
  if (canvas._chartInstance) {
    canvas._chartInstance.destroy();
  }

  // 6. Khởi tạo chart – axes vẫn hiện, data có hoặc không
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: device.deviceName,
        data: values,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: data.length
            ? `Lịch sử ${device.deviceName}`
            : `Không có dữ liệu ${fromDate || ""}→${toDate || ""}`
        },
      },
      scales: {
        x: { title: { display: true, text: "Thời gian" } },
        y: { title: { display: true, text: "Giá trị" } },
      },
    },
  });

  // 7. Lưu instance để lần sau có thể destroy
  canvas._chartInstance = chart;
}



// Biến đổi chuỗi thành Proper Case
function toProperCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

// Thiết lập sự kiện khi DOM load xong
document.addEventListener("DOMContentLoaded", function () {
  // 1. Đăng ký form thêm phòng
  const registerRoomForm = document.getElementById("registerRoomForm");
  registerRoomForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const roomName = document.getElementById("roomName").value.trim();
    if (!roomName) {
      showRoomFeedback("Vui lòng nhập tên phòng.", true);
      return;
    }
    const homeID = getQueryParam("home_id") || localStorage.getItem("activeHomeID");
    if (!homeID) {
      showRoomFeedback("Không xác định được home. Vui lòng chọn nhà.", true);
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/home/${homeID}/room_register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameRoom: roomName }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        showRoomFeedback(result.detail || "Đăng ký phòng thất bại.", true);
        return;
      }
      showRoomFeedback(result.message, false);
      fetchRooms(homeID);
      setTimeout(() => {
        const modalEl = document.getElementById("registerRoomModal");
        bootstrap.Modal.getInstance(modalEl).hide();
      }, 2000);
    } catch (error) {
      console.error("Error registering room:", error);
      showRoomFeedback("Có lỗi xảy ra, vui lòng thử lại sau.", true);
    }
  });

  // 2. Thêm bộ lọc ngày tháng
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.id = "from-date";
  fromInput.className = "form-control d-inline-block mx-2";

  const toInput = document.createElement("input");
  toInput.type = "date";
  toInput.id = "to-date";
  toInput.className = "form-control d-inline-block mx-2";

  const filterBtn = document.createElement("button");
  filterBtn.textContent = "Lọc theo thời gian";
  filterBtn.className = "btn btn-primary";
  filterBtn.onclick = () => {
    const homeID = getQueryParam("home_id") || localStorage.getItem("activeHomeID");
    fetch(`http://127.0.0.1:8000/home/${homeID}/all_devices`)
      .then((res) => res.json())
      .then((devices) => drawRoomDeviceCharts(devices))
      .catch((err) => console.error("Lỗi khi vẽ biểu đồ thiết bị:", err));
  };

  const controls = document.createElement("div");
  controls.className = "mb-4 text-center";
  controls.appendChild(fromInput);
  controls.appendChild(toInput);
  controls.appendChild(filterBtn);

  // 3. Fetch ban đầu khi load trang
  const homeID = getQueryParam("home_id") || localStorage.getItem("activeHomeID");
  if (homeID) {
    fetchRooms(homeID);
    const container = document.getElementById("individualChartsContainer");
    container.parentElement.insertBefore(controls, container);
    fetch(`http://127.0.0.1:8000/home/${homeID}/all_devices`)
      .then((res) => res.json())
      .then((devices) => drawRoomDeviceCharts(devices))
      .catch((err) => console.error("Lỗi khi vẽ biểu đồ thiết bị:", err));
  } else {
    document.getElementById("roomList").innerHTML =
      "<p>Không xác định được home. Vui lòng quay lại trang chủ và chọn nhà.</p>";
  }
});
