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
    const signinForm = document.getElementById("signinForm");
  
    signinForm.addEventListener("submit", async function (event) {
      event.preventDefault();
  
      // Lấy giá trị từ form
      const identifier = document.getElementById("identifier").value.trim();
      const password = document.getElementById("password").value.trim();
  
      if (!identifier || !password) {
        showFeedbackMessage("Vui lòng điền đầy đủ thông tin đăng nhập.", true);
        return;
      }
  
      const loginData = {
        identifier: identifier,
        password: password,
      };
  
      try {
        const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          showFeedbackMessage(result.detail || "Đăng nhập thất bại.", true);
          return;
        }
  
        showFeedbackMessage("Đăng nhập thành công!", false);
        localStorage.setItem("access_token", result.access_token);
        localStorage.setItem("userID", result.userID);
        setTimeout(() => {
          window.location.href = "home.html";
        }, 1000);
      } catch (error) {
        console.error("Error during sign in:", error);
        showFeedbackMessage("Có lỗi xảy ra, vui lòng thử lại sau.", true);
      }
    });
  });
  