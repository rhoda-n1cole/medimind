if (!getToken()) {
  window.location.href = "login.html";
}

const appointmentForm = document.getElementById("appointmentForm");
const appointmentList = document.getElementById("appointmentList");
const noAppointmentsMessage = document.getElementById("noAppointmentsMessage");
const errorMessage = document.getElementById("errorMessage");

function formatAppointmentDateTime(date, time) {
  return `${date} ${time}`;
}

async function loadAppointments() {
  const appointments = await apiRequest("/appointments", { method: "GET" });

  appointmentList.innerHTML = "";
  noAppointmentsMessage.style.display = appointments.length === 0 ? "block" : "none";

  appointments.forEach((appointment) => {
    const item = document.createElement("li");
    item.className = "medication-item";
    item.innerHTML = `
      <div>
        <div class="medication-name">${appointment.clinicName}</div>
        <div class="medication-meta">${formatAppointmentDateTime(appointment.date, appointment.time)}</div>
        ${appointment.notes ? `<div class="medication-meta">${appointment.notes}</div>` : ""}
      </div>
    `;
    appointmentList.appendChild(item);
  });
}

appointmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";

  const payload = {
    date: document.getElementById("appointmentDate").value,
    time: document.getElementById("appointmentTime").value,
    clinicName: document.getElementById("clinicName").value.trim(),
    notes: document.getElementById("notes").value.trim(),
  };

  try {
    await apiRequest("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    appointmentForm.reset();
    await loadAppointments();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

loadAppointments();