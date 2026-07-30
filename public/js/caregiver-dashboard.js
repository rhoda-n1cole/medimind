if (!getToken()) {
  window.location.href = "login.html";
}

document.getElementById("logoutButton").addEventListener("click", logOut);

function formatTime(scheduledTime) {
  return scheduledTime.split("T")[1].slice(0, 5);
}

function renderMedications(medications) {
  const list = document.getElementById("medicationList");
  list.innerHTML = "";

  medications.forEach((medication) => {
    const item = document.createElement("li");
    item.className = "medication-item";
    item.innerHTML = `
      <div>
        <div class="medication-name">${medication.name}</div>
        <div class="medication-meta">${medication.dosage} - ${medication.frequency.replace(/_/g, " ")}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderChecklist(doses) {
  const list = document.getElementById("checklistList");
  list.innerHTML = "";

  doses.forEach((dose) => {
    const item = document.createElement("li");
    item.className = "medication-item";
    const statusClass = dose.status === "taken" ? "status-taken" : dose.status === "missed" ? "status-missed" : "status-due";
    item.innerHTML = `
      <div>
        <div class="medication-name">${dose.medicationName}</div>
        <div class="medication-meta">${formatTime(dose.scheduledTime)}</div>
      </div>
      <span class="status-badge ${statusClass}">${translate(
        dose.status === "taken" ? "statusTaken" : dose.status === "missed" ? "statusMissed" : "statusDue"
      )}</span>
    `;
    list.appendChild(item);
  });
}

function renderAppointments(appointments) {
  const list = document.getElementById("appointmentList");
  list.innerHTML = "";

  appointments.forEach((appointment) => {
    const item = document.createElement("li");
    item.className = "medication-item";
    item.innerHTML = `
      <div>
        <div class="medication-name">${appointment.clinicName}</div>
        <div class="medication-meta">${appointment.date} ${appointment.time}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

async function loadCaregiverView() {
  const me = await apiRequest("/auth/me", { method: "GET" });

  if (me.role !== "caregiver") {
    window.location.href = "dashboard.html";
    return;
  }

  const noLinkedPatientMessage = document.getElementById("noLinkedPatientMessage");
  const linkedPatientContent = document.getElementById("linkedPatientContent");

  if (!me.linkedPatientId) {
    noLinkedPatientMessage.style.display = "block";
    linkedPatientContent.style.display = "none";
    return;
  }

  noLinkedPatientMessage.style.display = "none";
  linkedPatientContent.style.display = "block";

  const [medications, checklist, appointments] = await Promise.all([
    apiRequest("/medications", { method: "GET" }),
    apiRequest("/doses/today", { method: "GET" }),
    apiRequest("/appointments", { method: "GET" }),
  ]);

  renderMedications(medications);
  renderChecklist(checklist);
  renderAppointments(appointments);
}

loadCaregiverView();