// Hàm lấy tham số từ URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Hàm hiển thị thông báo
function showHomeFeedback(message, isError = true) {
  const feedbackDiv = document.getElementById("homeFeedback");
  feedbackDiv.classList.remove("feedback-error", "feedback-success");
  feedbackDiv.classList.add(isError ? "feedback-error" : "feedback-success");
  feedbackDiv.textContent = message;
  feedbackDiv.style.display = "block";
  setTimeout(() => {
    feedbackDiv.style.display = "none";
  }, 5000);
}

// Hàm load danh sách nhà của user từ backend
function fetchUserHomes(userID) {
  fetch(`http://127.0.0.1:8000/user/${userID}/homes`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch homes");
      }
      return response.json();
    })
    .then(data => displayHomeList(data))
    .catch(error => {
      console.error("Error fetching home list:", error);
      document.getElementById("homeList").innerHTML = "<p>Lỗi khi tải danh sách nhà.</p>";
    });
}

function displayHomeList(homes) {
  const homeListDiv = document.getElementById("homeList");
  homeListDiv.innerHTML = ""; // Xóa nội dung cũ

  if (!homes || homes.length === 0) {
      homeListDiv.innerHTML = "<p>Không có nhà nào được đăng ký.</p>";
      return;
  }

  homes.forEach(home => {
    const col = document.createElement("div");
    col.className = "col-md-5";
    col.innerHTML = `
        <div class="house-card position-relative">
            <div class="safety-status position-absolute top-0 start-0 m-2"></div>
            <button class="btn btn-danger position-absolute top-0 end-0 m-2" onclick="deleteHome(${home.homeID})">
                <i class="fas fa-trash-alt"></i>
            </button>
            <img src="../images/house.jpg" alt="House Image" class="img-fluid" />
            <div class="location-info">
                <p>Địa chỉ: ${home.address}</p>
                <p>Home ID: ${home.homeID}</p>
                <button class="btn btn-outline-primary" onclick="selectHome(${home.homeID})">Chọn nhà này</button>
            </div>
        </div>
    `;
    homeListDiv.appendChild(col);
    fetch(`http://127.0.0.1:8000/home/${home.homeID}/status`)
      .then(response => response.json())
      .then(status => {
        const statusContainer = col.querySelector(".safety-status");
        
        if (status.is_safe) {
          statusContainer.innerHTML = `
            <div class="d-flex align-items-center gap-1 bg-white rounded px-2 py-1">
              <img src="../images/safe.png" alt="Safe" style="width: 20px; height: 20px;" />
              <span class="fw-bold text-success small">Safe!</span>
            </div>
          `;
        } else {
          // Create warning details (hidden by default)
          const warningDetails = status.reasons.map(reason => 
            `<div class="alert alert-danger p-1 mb-1 small">${reason}</div>`
          ).join('');
          
          statusContainer.innerHTML = `
            <div class="safety-status-wrapper">
              <div class="d-flex align-items-center gap-1 bg-white rounded px-2 py-1 warning-header">
                <img src="../images/warning.png" alt="Warning" style="width: 20px; height: 20px;" />
                <span class="fw-bold text-danger small">
                  Warning! (${status.reasons.length} issues)
                </span>
                <i class="bi bi-chevron-down ms-auto"></i>
              </div>
              <div class="warning-details">
                ${warningDetails}
              </div>
            </div>
          `;
        }
      })
      .catch(error => {
        console.error("Error fetching safety status:", error);
        col.querySelector(".safety-status").innerHTML = `
          <div class="alert alert-warning p-1 small">
            <i class="bi bi-exclamation-triangle"></i> Status check failed
          </div>
        `;
      });
  });
}



// Hàm chọn nhà: lưu homeID và chuyển sang trang chọn phòng
function selectHome(homeID) {
  localStorage.setItem("activeHomeID", homeID);
  window.location.href = "room.html?home_id=" + homeID;
}

async function deleteHome(homeID) {
  if (!confirm("Bạn có chắc chắn muốn xóa ngôi nhà này?")) return;

  try {
    const userID = localStorage.getItem("userID");
    const response = await fetch(`http://127.0.0.1:8000/home/${homeID}/delete?user_id=${userID}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const result = await response.json();
      showHomeFeedback(result.detail || "Xóa nhà thất bại.", true);
      return;
    }
    showHomeFeedback("Nhà đã được xóa thành công.", false);
    // Reload danh sách nhà
    fetchUserHomes(localStorage.getItem("userID"));
  } catch (error) {
    console.error("Error deleting home:", error);
    showHomeFeedback("Có lỗi xảy ra khi xóa nhà.", true);
  }
}




// Xử lý form đăng ký nhà mới
document.getElementById("registerHomeForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const address = document.getElementById("homeAddress").value.trim();
  if (!address) {
    showHomeFeedback("Vui lòng nhập địa chỉ nhà.", true);
    return;
  }
  const userID = localStorage.getItem("userID");
  if (!userID) {
    showHomeFeedback("Bạn cần đăng nhập trước.", true);
    setTimeout(() => {
      window.location.href = "sign_in.html";
    }, 2000);
    return;
  }
  const payload = { address: address };

  try {
    const response = await fetch(`http://127.0.0.1:8000/user/${userID}/home_register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      showHomeFeedback(result.detail || "Đăng ký nhà thất bại.", true);
      return;
    }
    showHomeFeedback(result.message, false);
    // Reload danh sách nhà sau khi đăng ký thành công
    fetchUserHomes(userID);
    // Đóng modal sau 2 giây
    setTimeout(() => {
      const modalEl = document.getElementById("registerHomeModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }, 2000);
  } catch (error) {
    console.error("Error registering home:", error);
    showHomeFeedback("Có lỗi xảy ra, vui lòng thử lại sau.", true);
  }
});

// Khi trang load, lấy userID và tải danh sách nhà
document.addEventListener("DOMContentLoaded", function () {
  const userID = localStorage.getItem("userID");
  if (userID) {
    fetchUserHomes(userID);
  } else {
    document.getElementById("homeList").innerHTML = "<p>Không xác định được user. Vui lòng đăng nhập lại.</p>";
  }
});
