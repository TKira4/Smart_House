// Hàm hiển thị thông báo ngay trên trang
function showFeedbackMessage(message, isError = true) {
    const feedbackDiv = document.getElementById("feedbackMessage");
    feedbackDiv.classList.remove("feedback-error", "feedback-success");
  
    if (isError) {
      feedbackDiv.classList.add("feedback-error");
    } else {
      feedbackDiv.classList.add("feedback-success");
    }
  
    feedbackDiv.textContent = message;
    feedbackDiv.style.display = "block";
  
    setTimeout(() => {
      feedbackDiv.style.display = "none";
    }, 5000);
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
  
    signupForm.addEventListener("submit", async function (event) {
      event.preventDefault(); // Ngăn chặn reload trang
  
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const email = document.getElementById("email").value.trim();
      const username = document.getElementById("username").value.trim();
      const contactNumber = document.getElementById("contactNumber").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();
  
      // Kiểm tra dữ liệu
      if (!firstName || !lastName || !email || !username || !contactNumber || !password || !confirmPassword) {
        showFeedbackMessage("Vui lòng điền đầy đủ thông tin.", true);
        return;
      }
  
      if (password !== confirmPassword) {
        showFeedbackMessage("Mật khẩu xác nhận không khớp.", true);
        return;
      }
  
      // Tạo payload
      const userData = {
        fName: firstName,
        lName: lastName,
        email: email,
        userName: username,
        phoneNumber: contactNumber,
        password: password,
        confirmPassword: confirmPassword
      };
  
      try {
        const response = await fetch("http://127.0.0.1:8000/api/v1/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          showFeedbackMessage(result.detail || "Đăng ký thất bại.", true);
          return;
        }
  
        showFeedbackMessage(result.message, false);
  
        // Chuyển hướng sau 1 giây
        setTimeout(() => {
          window.location.href = "sign_in.html";
        }, 1000);
  
      } catch (error) {
        console.error("Error during signup:", error);
        showFeedbackMessage("Có lỗi xảy ra, vui lòng thử lại sau.", true);
      }
    });
  });
  