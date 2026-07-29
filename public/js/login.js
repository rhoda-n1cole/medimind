document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    window.location.href = "dashboard.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});