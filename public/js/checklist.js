if (!getToken()) {
  window.location.href = "login.html";
}

const checklistList = document.getElementById("checklistList");
const noDosesMessage = document.getElementById("noDosesMessage");
const weeklySummaryText = document.getElementById("weeklySummaryText");
const weeklySummaryBar = document.getElementById("weeklySummaryBar");

function formatTime(scheduledTime) {
  return scheduledTime.split("T")[1].slice(0, 5);
}

function getChecklistStatusLabel(status) {
  if (status === "taken") {
    return translate("statusTaken");
  }
  if (status === "missed") {
    return translate("statusMissed");
  }
  return translate("statusDue");
}

function getChecklistStatusClass(status) {
  if (status === "taken") {
    return "status-taken";
  }
  if (status === "missed") {
    return "status-missed";
  }
  return "status-due";
}

async function loadChecklist() {
  const doses = await apiRequest("/doses/today", { method: "GET" });

  checklistList.innerHTML = "";
  noDosesMessage.style.display = doses.length === 0 ? "block" : "none";

  doses.forEach((dose) => {
    const item = document.createElement("li");
    item.className = "medication-item";

    const takeButton =
      dose.status === "taken"
        ? ""
        : `<button class="btn-secondary confirm-button" data-id="${dose.id}">${translate("markAsTaken")}</button>`;

    item.innerHTML = `
      <div>
        <div class="medication-name">${dose.medicationName}</div>
        <div class="medication-meta">${formatTime(dose.scheduledTime)}</div>
      </div>
      <div>
        <span class="status-badge ${getChecklistStatusClass(dose.status)}">${getChecklistStatusLabel(dose.status)}</span>
        ${takeButton}
      </div>
    `;
    checklistList.appendChild(item);
  });

  document.querySelectorAll(".confirm-button").forEach((button) => {
    button.addEventListener("click", () => confirmDose(button.dataset.id));
  });
}

async function confirmDose(id) {
  await apiRequest(`/doses/${id}/confirm`, { method: "POST" });
  await loadChecklist();
  await loadWeeklySummary();
}

async function loadWeeklySummary() {
  const summary = await apiRequest("/doses/weekly-summary", { method: "GET" });
  weeklySummaryText.textContent = `${summary.taken} / ${summary.total} ${translate("dosesTakenThisWeek")} (${summary.percentage}%)`;
  weeklySummaryBar.style.width = `${summary.percentage}%`;
}

loadChecklist();
loadWeeklySummary();