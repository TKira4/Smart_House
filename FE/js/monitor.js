// monitor.js

// ======================
// Constants and Config
// ======================
const API_BASE_URL = 'http://127.0.0.1:8000';
const POLLING_INTERVAL = 5000;
const charts = {}; // Stores Chart instances

// ======================
// Device Control Types
// ======================
const DeviceControlType = {
  TOGGLE: 'toggle',
  SLIDER: 'slider',
  BUTTON: 'button',
  NONE: 'none'
};

// ======================
// Core Functions
// ======================

/**
 * Initialize the monitoring dashboard
 */
async function initializeDashboard() {
  const roomID = localStorage.getItem("activeRoomID");
  const homeID = localStorage.getItem("activeHomeID");

  if (!roomID || !homeID) {
    console.error("Room or home ID not found");
    return;
  }

  try {
    // Load initial data
    const [homeInfo, roomInfo, devices] = await Promise.all([
      fetchHomeInfo(homeID),
      fetchRoomInfo(roomID),
      fetchRoomDevices(roomID)
    ]);

    // Update UI
    updateLocationInfo(homeInfo, roomInfo);
    renderDashboard(devices);
    setupChartSection(devices);
    
    // Start polling for updates
    startDevicePolling(roomID);
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

/**
 * Render the main device dashboard
 */
function renderDashboard(devices) {
  const container = document.getElementById("dashboard-container");
  container.innerHTML = '';

  devices.forEach(device => {
    const controlType = determineControlType(device);
    const card = createDeviceCard(device, controlType);
    container.appendChild(card);
  });

  setupControlListeners();
}

/**
 * Create a device card element
 */
function createDeviceCard(device, controlType) {
  const card = document.createElement("div");
  card.className = "monitor-card col-auto";
  card.style.position = "relative";

  const iconSrc = getDeviceIcon(device);
  const controlElement = createControlElement(device, controlType);

  card.innerHTML = `
    <button class="btn btn-danger btn-sm" style="position: absolute; top: 5px; right: 5px;" 
            onclick="deleteDevice(${device.deviceID})">
      <i class="fas fa-trash-alt"></i>
    </button>
    <img src="../images/${iconSrc}" alt="${device.deviceName}" class="monitor-icon" />
    <h3>${device.deviceName}</h3>
    <div id="device-${device.deviceID}" class="device-value mt-3">
      ${controlElement}
    </div>
  `;

  return card;
}

/**
 * Determine the control type for a device
 */
function determineControlType(device) {
  if (device.deviceName.toLowerCase().includes("cảm biến")) {
    return DeviceControlType.NONE;
  }
  
  if (device.feedName.toLowerCase() === 'quat') {
    return DeviceControlType.SLIDER;
  }
  
  if (device.type === 'non-numeric') {
    return DeviceControlType.TOGGLE;
  }
  
  return DeviceControlType.BUTTON;
}

/**
 * Create the appropriate control element
 */
function createControlElement(device, controlType) {
  switch (controlType) {
    case DeviceControlType.TOGGLE:
      return createToggleControl(device);
    case DeviceControlType.SLIDER:
      return createFanSlider(device);
    case DeviceControlType.BUTTON:
      return createAdjustButton(device);
    default:
      const deviceName = device.feedName;
      let unit = '';
      if (deviceName.includes("nhietdo")) {
        unit = '°C';
      } else if (deviceName.includes("doam")) {
        unit = '%';
      } else if (deviceName.includes("anhsang")) {
        unit = ' lux';
      }
      return `<div class="value-display">${device.lastValue || '--'}${unit}</div>`;
  }
}

function createToggleControl(device) {
  const isOn = device.lastValue === 'ON' || device.lastValue === '1';
  return `
    <div class="toggle-control">
      <span class="toggle-status">${isOn ? 'ON' : 'OFF'}</span><br>
      <label class="switch">
        <input type="checkbox" ${isOn ? 'checked' : ''}
               data-device-id="${device.deviceID}"
               data-feed-name="${device.feedName}">
        <span class="slider round"></span>
      </label>
    </div>
  `;
}

function createFanSlider(device) {
  const value = parseInt(device.lastValue) || 0;
  return `
    <div class="slider-control">
      <input type="range" min="0" max="100" value="${value}"
             data-device-id="${device.deviceID}"
             data-feed-name="${device.feedName}">
      <output>${value}%</output>
    </div>
  `;
}

function createAdjustButton(device) {
  return `
    <div class="adjust-control">
      <span class="value-display">${device.lastValue || '--'}</span><br>
      <button class="btn btn-primary btn-sm" 
              onclick="showAdjustPrompt(${device.deviceID}, '${device.feedName}')">
        <i class="fas fa-cogs"></i> Điều chỉnh
      </button>
    </div>
  `;
}

// ======================
// Event Handlers
// ======================

function setupControlListeners() {
  // Toggle switches
  document.querySelectorAll('.toggle-control input').forEach(toggle => {
    toggle.addEventListener('change', handleToggleChange);
  });

  // Fan sliders
  document.querySelectorAll('.slider-control input').forEach(slider => {
    slider.addEventListener('input', handleSliderInput);
  });
}

async function handleToggleChange(event) {
  const toggle = event.target;
  const toggleControl = toggle.closest('.toggle-control');
  const statusText = toggleControl.querySelector('.toggle-status');
  const deviceID = toggle.dataset.deviceId;
  const feedName = toggle.dataset.feedName;
  const newValue = toggle.checked ? 'ON' : 'OFF';
  
  // Update UI immediately
  statusText.textContent = newValue;
  
  try {
    await controlDevice(deviceID, feedName, newValue);
  } catch (error) {
    console.error("Toggle control failed:", error);
    toggle.checked = !toggle.checked;
    statusText.textContent = toggle.checked ? 'ON' : 'OFF';
  }
}

async function handleSliderInput(event) {
  const slider = event.target;
  const output = slider.nextElementSibling;
  const value = slider.value;
  
  // Update UI immediately
  output.textContent = `${value}%`;
  
  // Debounce the API call
  clearTimeout(slider.debounceTimer);
  slider.debounceTimer = setTimeout(async () => {
    try {
      await controlDevice(
        slider.dataset.deviceId,
        slider.dataset.feedName,
        value
      );
    } catch (error) {
      console.error("Slider control failed:", error);
    }
  }, 300);
}

async function showAdjustPrompt(deviceID, feedName) {
  const command = prompt("Nhập lệnh điều chỉnh:");
  if (command) {
    try {
      await controlDevice(deviceID, feedName, command);
    } catch (error) {
      console.error("Adjust failed:", error);
      alert("Điều chỉnh thất bại");
    }
  }
}

// ======================
// Device Control
// ======================

async function controlDevice(deviceID, feedName, command) {
  const userID = localStorage.getItem("userID");
  if (!userID) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/device/${deviceID}/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      command,
      user_id: parseInt(userID),
      feed_name: feedName
    })
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || "Control failed");
  }
}

async function deleteDevice(deviceID) {
  if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
  
  const userID = localStorage.getItem("userID");
  if (!userID) {
    alert("Vui lòng đăng nhập lại");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/device/${deviceID}/delete?user_id=${userID}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.detail || "Delete failed");
    }

    // Refresh the dashboard
    const roomID = localStorage.getItem("activeRoomID");
    const devices = await fetchRoomDevices(roomID);
    renderDashboard(devices);
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Xóa thiết bị thất bại");
  }
}

// ======================
// Device Registration
// ======================
document.getElementById("registerDeviceForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  
  const deviceName = document.getElementById("deviceName").value.trim();
  const deviceType = document.getElementById("deviceType").value;
  const feedName = document.getElementById("feedName").value.trim();
  const userID = localStorage.getItem("userID");
  const roomID = localStorage.getItem("activeRoomID");

  // Validation
  if (!deviceName || !deviceType || !feedName) {
    showFeedback("Vui lòng nhập đầy đủ thông tin", true);
    return;
  }
  if (!userID) {
    showFeedback("Vui lòng đăng nhập lại", true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/room/${roomID}/device_register?user_id=${userID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName, type: deviceType, feedName })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Registration failed");

    showFeedback("Đăng ký thiết bị thành công", false);
    
    // Refresh the dashboard
    const devices = await fetchRoomDevices(roomID);
    renderDashboard(devices);
    setupChartSection(devices);
  } catch (error) {
    console.error("Registration failed:", error);
    showFeedback(error.message || "Đăng ký thất bại", true);
  }
});

function showFeedback(message, isError) {
  const feedback = document.getElementById("deviceFeedback");
  feedback.textContent = message;
  feedback.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
  feedback.style.display = 'block';
  
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 5000);
}

// ======================
// Data Fetching
// ======================

async function fetchRoomDevices(roomID) {
  const response = await fetch(`${API_BASE_URL}/room/${roomID}/devices`);
  if (!response.ok) throw new Error("Failed to fetch devices");
  return await response.json();
}

async function fetchHomeInfo(homeID) {
  const response = await fetch(`${API_BASE_URL}/home/${homeID}`);
  if (!response.ok) throw new Error("Failed to fetch home info");
  return await response.json();
}

async function fetchRoomInfo(roomID) {
  const response = await fetch(`${API_BASE_URL}/room/${roomID}`);
  if (!response.ok) throw new Error("Failed to fetch room info");
  return await response.json();
}

async function updateDeviceValues(devices) {
  const updatePromises = devices.map(async device => {
    try {
      const response = await fetch(`${API_BASE_URL}/device/${device.deviceID}/data/last`);
      if (!response.ok) return;
      
      const data = await response.json();
      updateDeviceDisplay(device.deviceID, data.value);
    } catch (error) {
      console.error(`Update failed for device ${device.deviceID}:`, error);
    }
  });

  await Promise.all(updatePromises);
}

function updateDeviceDisplay(deviceID, value) {
  const display = document.getElementById(`device-${deviceID}`);
  if (!display) return;

  // Check if this is a controlled device
  const toggleInput = display.querySelector('.toggle-control input[type="checkbox"]');
  const toggleStatus = display.querySelector('.toggle-control .toggle-status');
  const slider = display.querySelector('.slider-control input');
  
  if (toggleInput && toggleStatus) {
    const isOn = value === 'ON' || value === '1';
    toggleInput.checked = isOn;
    toggleStatus.textContent = isOn ? 'ON' : 'OFF';
  } 
  else if (slider) {
    slider.value = parseInt(value) || 0;
    slider.nextElementSibling.textContent = `${slider.value}%`;
  }
  else {
    const valueDisplay = display.querySelector('.value-display');
    if (valueDisplay) {
      const currentText = valueDisplay.textContent;
      let unit = '';
      
      if (currentText.includes('°C')) unit = '°C';
      else if (currentText.includes('%') && !currentText.includes('100%')) unit = '%';
      else if (currentText.includes('lux')) unit = ' lux';
      
      valueDisplay.textContent = (value || '--') + unit;
    }
  }
}

// ======================
// Chart Functions
// ======================

function setupChartSection(devices) {
  const section = document.getElementById("chart-section");
  section.innerHTML = "<h4 class='text-center'>Biểu đồ các thiết bị Numeric</h4>";

  devices
    .filter(device => device.type === "numeric" && !["quat", "admin", "mat-khau", "mauled"].includes(device.feedName.toLowerCase()))
    .forEach(device => {
      const container = document.createElement("div");
      container.className = "chart-container mb-3";
      container.innerHTML = `<canvas id="chart-${device.deviceID}"></canvas>`;
      section.appendChild(container);
      renderDeviceChart(device);
    });
}

async function renderDeviceChart(device) {
  try {
    const response = await fetch(`${API_BASE_URL}/device/${device.deviceID}/data/history?limit=20`);
    if (!response.ok) return;
    
    const data = await response.json();
    if (!data.length) return;

    const ctx = document.getElementById(`chart-${device.deviceID}`).getContext('2d');
    
    charts[device.deviceID] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.reverse().map(d => d.created_at?.substring(11, 16) || ''),
        datasets: [{
          label: device.deviceName,
          data: data.map(d => parseFloat(d.value)),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Lịch sử ${device.deviceName}`
          }
        },
        scales: {
          x: { title: { display: true, text: 'Thời gian' } },
          y: {
            title: { 
              display: true, 
              text: device.feedName.includes("nhietdo") ? 'Nhiệt độ (°C)' :
                    device.feedName.includes("doam") ? 'Độ ẩm (%)' :
                    device.feedName.includes("anhsang") ? 'Ánh sáng (lux)' :
                    'Giá trị'
            } 
          }
        }
      }
    });
  } catch (error) {
    console.error(`Chart render failed for device ${device.deviceID}:`, error);
  }
}

// ======================
// Utility Functions
// ======================

function updateLocationInfo(homeInfo, roomInfo) {
  const homeSpan = document.getElementById("home-info");
  const roomSpan = document.getElementById("room-info");
  
  if (homeInfo?.address) homeSpan.textContent = `Nhà: ${homeInfo.address}`;
  if (roomInfo?.nameRoom) roomSpan.textContent = `Phòng: ${roomInfo.nameRoom}`;
}

function getDeviceIcon(device) {
  const name = device.deviceName.toLowerCase();
  if (name.includes("nhiệt độ") || name.includes("nhiet do")) return 'nhietdo.png';
  if (name.includes("độ ẩm") || name.includes("do am")) return 'doam.png';
  if (name.includes("ánh sáng") || name.includes("anh sang")) return 'anhsang.png';
  if (name.includes("quạt") || name.includes("quat") || name.includes("fan")) return 'fan2.png';
  if (name.includes("đèn") || name.includes("den") || name.includes("led")) return 'led.png';
  if (name.includes("cửa") || name.includes("cua") || name.includes("door")) return 'door.png';
  if (name.includes("bơm") || name.includes("bom")) return 'maybom.png';
  return 'default.png';
}

function startDevicePolling(roomID) {
  setInterval(async () => {
    try {
      const devices = await fetchRoomDevices(roomID);
      await updateDeviceValues(devices);
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, POLLING_INTERVAL);
}

// ======================
// Initialization
// ======================
document.addEventListener("DOMContentLoaded", initializeDashboard);