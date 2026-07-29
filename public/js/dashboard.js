if (!getToken()) {
  window.location.href = "login.html";
}

const medicationForm = document.getElementById("medicationForm");
const medicationIdField = document.getElementById("medicationId");
const medicationList = document.getElementById("medicationList");
const noMedicationsMessage = document.getElementById("noMedicationsMessage");
const errorMessage = document.getElementById("errorMessage");
const submitButton = document.getElementById("medicationSubmitButton");

document.getElementById("logoutButton").addEventListener("click", logOut);

function getScheduleStatus(medication) {
  const today = new Date().toISOString().split("T")[0];
  if (medication.startDate > today) {
    return { key: "statusUpcoming", className: "status-due" };
  }
  if (medication.endDate && medication.endDate < today) {
    return { key: "statusEnded", className: "status-missed" };
  }
  return { key: "statusActive", className: "status-taken" };
}

function renderMedications(medications) {
  medicationList.innerHTML = "";
  noMedicationsMessage.style.display = medications.length === 0 ? "block" : "none";

  medications.forEach((medication) => {
    const status = getScheduleStatus(medication);

    const item = document.createElement("li");
    item.className = "medication-item";
    item.innerHTML = `
      <div>
        <div class="medication-name">${medication.name}</div>
        <div class="medication-meta">${medication.dosage} - ${medication.frequency.replace(/_/g, " ")}</div>
      </div>
      <div>
        <span class="status-badge ${status.className}">${translate(status.key)}</span>
        <button class="btn-secondary edit-button" data-id="${medication.id}">${translate("edit")}</button>
        <button class="btn-secondary delete-button" data-id="${medication.id}">${translate("delete")}</button>
      </div>
    `;
    medicationList.appendChild(item);
  });

  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", () => startEdit(button.dataset.id, medications));
  });
  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteMedication(button.dataset.id));
  });
}

async function loadMedications() {
  try {
    const medications = await apiRequest("/medications", { method: "GET" });
    renderMedications(medications);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

function startEdit(id, medications) {
  const medication = medications.find((item) => String(item.id) === String(id));
  if (!medication) {
    return;
  }

  medicationIdField.value = medication.id;
  document.getElementById("medicationName").value = medication.name;
  document.getElementById("dosage").value = medication.dosage;
  document.getElementById("frequency").value = medication.frequency;
  document.getElementById("doseTimes").value = (medication.doseTimes || []).join(", ");
  document.getElementById("reminderOffset").value = medication.reminderOffsetMinutes || 0;
  document.getElementById("startDate").value = medication.startDate;
  document.getElementById("endDate").value = medication.endDate || "";
  submitButton.textContent = translate("saveChanges");
  medicationForm.scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  medicationForm.reset();
  medicationIdField.value = "";
  submitButton.textContent = translate("addMedicationButton");
}

async function deleteMedication(id) {
  if (!window.confirm(translate("confirmDeleteMedication"))) {
    return;
  }

  try {
    await apiRequest(`/medications/${id}`, { method: "DELETE" });
    await loadMedications();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

medicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";

  const payload = {
    name: document.getElementById("medicationName").value.trim(),
    dosage: document.getElementById("dosage").value.trim(),
    frequency: document.getElementById("frequency").value,
    doseTimes: document.getElementById("doseTimes").value
      .split(",")
      .map((time) => time.trim())
      .filter((time) => time.length > 0),
    reminderOffsetMinutes: Number(document.getElementById("reminderOffset").value),
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value || null,
  };

  const id = medicationIdField.value;

  try {
    if (id) {
      await apiRequest(`/medications/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiRequest("/medications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    resetForm();
    await loadMedications();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

document.getElementById("generateCodeButton").addEventListener("click", async () => {
  const linkCodeDisplay = document.getElementById("linkCodeDisplay");
  try {
    const data = await apiRequest("/auth/link-code", { method: "POST" });
    linkCodeDisplay.textContent = `${translate("linkCodeLabel")} ${data.code}`;
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

loadMedications();