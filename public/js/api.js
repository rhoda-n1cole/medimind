const API_BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("medimind_token");
}

function setToken(token) {
  localStorage.setItem("medimind_token", token);
}

function clearToken() {
  localStorage.removeItem("medimind_token");
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function logOut() {
  clearToken();
  window.location.href = "login.html";
}