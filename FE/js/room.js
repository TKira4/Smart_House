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

// Hàm tải danh sách phòng từ API
function fetchRooms(homeID) {
  fetch(`http://127.0.0.1:8000/home/${homeID}/rooms`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      return response.json();
    })
    .then((data) => displayRoomList(data))
    .catch((error) => {
      console.error("Error fetching room list:", error);
      document.getElementById("roomList").innerHTML =
        "<p>Lỗi khi tải danh sách phòng.</p>";
    });
}

// Hàm hiển thị danh sách phòng (giống style trang Giám Sát)
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

function selectRoom(roomID) {
  localStorage.setItem("activeRoomID", roomID);
  window.location.href = "monitor.html";
}

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

document.addEventListener("DOMContentLoaded", function () {
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
    const payload = { nameRoom: roomName };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/home/${homeID}/room_register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      }, 2000);
    } catch (error) {
      console.error("Error registering room:", error);
      showRoomFeedback("Có lỗi xảy ra, vui lòng thử lại sau.", true);
    }
  });

  const homeID = getQueryParam("home_id") || localStorage.getItem("activeHomeID");
  if (homeID) {
    fetchRooms(homeID);
    fetch(`http://127.0.0.1:8000/home/${homeID}/all_devices`)
      .then((res) => res.json())
      .then((devices) => drawRoomDeviceCharts(devices))
      .catch((err) => console.error("Lỗi khi vẽ biểu đồ thiết bị:", err));
  } else {
    document.getElementById("roomList").innerHTML =
      "<p>Không xác định được home. Vui lòng quay lại trang chủ và chọn nhà.</p>";
  }
});

function toProperCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

async function drawRoomDeviceCharts(devices) {
  const container = document.getElementById("individualChartsContainer");
  container.innerHTML = ""; // Xóa biểu đồ cũ nếu có

  const filtered = devices.filter((d) => d.type === "numeric");

  for (const device of filtered) {
    const chartWrapper = document.createElement("div");
    chartWrapper.className = "chart-container mb-4";
    chartWrapper.innerHTML = `
    <h5>${device.deviceName} (${device.roomName})</h5>
    <canvas id="chart-${device.deviceID}" height="200"></canvas>
  `;

    container.appendChild(chartWrapper);
    await renderDeviceChart(device);
  }
}


async function renderDeviceChart(device) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/device/${device.deviceID}/data/history?limit=20`);
    if (!response.ok) return;
    const data = await response.json();
    if (!data.length) return;

    const ctx = document.getElementById(`chart-${device.deviceID}`).getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.created_at.substring(11, 16)),
        datasets: [{
          label: device.deviceName,
          data: data.map((d) => parseFloat(d.value)),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Lịch sử ${device.deviceName}`,
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Thời gian" },
          },
          y: {
            title: { display: true, text: "Giá trị" },
          },
        },
      },
    });
  } catch (error) {
    console.error(`Chart render failed for device ${device.deviceID}:`, error);
  }
}
