document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const linkCode = document.getElementById("linkCode").value.trim();

  if (password !== confirmPassword) {
    errorMessage.textContent = translate("passwordMismatch");
    return;
  }

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, phoneNumber, password, linkCode: linkCode || undefined }),
    });

    setToken(data.token);
    window.location.href = data.role === "caregiver" ? "caregiver-dashboard.html" : "dashboard.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});