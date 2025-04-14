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
    // Tạo card kiểu monitor-card
    const card = document.createElement("div");
    card.className = "monitor-card";
    card.style.position = "relative";

    // Icon cho phòng
    let iconSrc = "../images/room.png";
    const lowerName = room.nameRoom.toLowerCase();
    if (lowerName.includes("tắm")) {
      iconSrc = "../images/bathroom.png";
    } else if (lowerName.includes("khách")) {
      iconSrc = "../images/livingroom.png";
    } else if (lowerName.includes("ngủ")) {
      iconSrc = "../images/bedroom.png";
    }

    // Nút xóa phòng (góc trên phải)
    const deleteButton = `
      <button class="btn btn-danger btn-sm" style="position:absolute; top:5px; right:5px;"
              onclick="deleteRoom(${room.roomID})">
        <i class="fas fa-trash-alt"></i>
      </button>`;

    // Nút chọn phòng
    const chooseButton = `
      <button class="btn btn-primary mt-2" onclick="selectRoom(${room.roomID})">
        Chọn phòng
      </button>`;

    // Nội dung card
    card.innerHTML = `
      ${deleteButton}
      <img src="${iconSrc}" alt="${room.nameRoom}" class="monitor-icon" />
      <h3>${room.nameRoom}</h3>
      <p>Room ID: ${room.roomID}</p>
      ${chooseButton}
    `;

    // Thêm card vào roomListDiv
    roomListDiv.appendChild(card);
  });
}

// Khi người dùng chọn 1 phòng, lưu roomID và chuyển sang trang monitor
function selectRoom(roomID) {
  localStorage.setItem("activeRoomID", roomID);
  window.location.href = "monitor.html";
}

// Xóa phòng
async function deleteRoom(roomID) {
  if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;

  // Lấy homeID
  const homeID =
    getQueryParam("home_id") || localStorage.getItem("activeHomeID");
  if (!homeID) {
    alert("Không xác định được home. Vui lòng quay lại trang chủ và chọn nhà.");
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/home/${homeID}/room_delete/${roomID}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      const result = await response.json();
      alert(result.detail || "Xóa phòng thất bại.");
      return;
    }
    alert("Phòng đã được xóa.");
    fetchRooms(homeID); // Cập nhật danh sách sau khi xóa
  } catch (error) {
    console.error("Error deleting room:", error);
    alert("Có lỗi xảy ra khi xóa phòng.");
  }
}

// Xử lý form đăng ký phòng mới
document.addEventListener("DOMContentLoaded", function () {
  const registerRoomForm = document.getElementById("registerRoomForm");
  registerRoomForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const roomName = document.getElementById("roomName").value.trim();
    if (!roomName) {
      showRoomFeedback("Vui lòng nhập tên phòng.", true);
      return;
    }
    const homeID =
      getQueryParam("home_id") || localStorage.getItem("activeHomeID");
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        showRoomFeedback(result.detail || "Đăng ký phòng thất bại.", true);
        return;
      }
      showRoomFeedback(result.message, false);
      // Reload danh sách phòng
      fetchRooms(homeID);
      // Đóng modal sau 2 giây
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

  // Khi trang load, lấy homeID và tải danh sách phòng
  const homeID =
    getQueryParam("home_id") || localStorage.getItem("activeHomeID");
  if (homeID) {
    fetchRooms(homeID);

    /* UYEN UPDATE 13 APR */
    // NEW: Gọi API tất cả thiết bị trong home để vẽ biểu đồ tổng hợp
    fetch(`http://127.0.0.1:8000/home/${homeID}/all_devices`)
      .then((res) => res.json())
      .then((devices) => drawCombinedCharts(devices))
      .catch((err) => console.error("Lỗi khi vẽ biểu đồ tổng hợp:", err));
  } else {
    document.getElementById("roomList").innerHTML =
      "<p>Không xác định được home. Vui lòng quay lại trang chủ và chọn nhà.</p>";
  }
});

/* UYEN UPDATE 13 APR 

async function drawCombinedCharts(devices) {
  const categories = {
    "nhiệt độ": [],
    "độ ẩm": [],
    "ánh sáng": [],
  };

  // Phân loại thiết bị
  devices.forEach((device) => {
    const name = device.deviceName.toLowerCase();
    if (name.includes("nhiệt độ")) categories["nhiệt độ"].push(device);
    else if (name.includes("độ ẩm")) categories["độ ẩm"].push(device);
    else if (name.includes("ánh sáng")) categories["ánh sáng"].push(device);
  });

  // Hàm fetch lịch sử cho 1 thiết bị
  async function fetchHistory(device) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/device/${device.deviceID}/data/history?limit=20`
      );
      const data = await res.json();
      return data.reverse(); // để đúng thứ tự thời gian
    } catch {
      return [];
    }
  }

  // Hàm vẽ biểu đồ
  async function renderChart(canvasId, deviceList) {
    const datasets = [];
    let labels = [];

    for (const device of deviceList) {
      const history = await fetchHistory(device);
      if (history.length === 0) continue;

      if (labels.length === 0) {
        labels = history.map((d) => d.created_at.substring(11, 16)); // hh:mm
      }

      datasets.push({
        label: device.deviceName,
        data: history.map((d) => parseFloat(d.value)),
        fill: false,
        tension: 0.3,
      });
    }

    new Chart(document.getElementById(canvasId), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ ${canvasId}`,
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  }

  await renderChart("tempChart", categories["nhiệt độ"]);
  await renderChart("humidityChart", categories["độ ẩm"]);
  await renderChart("lightChart", categories["ánh sáng"]);
} */

  function toProperCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

