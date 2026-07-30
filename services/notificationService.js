const cron = require("node-cron");
const webpush = require("web-push");
const crypto = require("crypto");
const db = require("../db");

webpush.setVapidDetails(
  "mailto:admin@medimind.example",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const FOLLOW_UP_DELAY_MINUTES = 30;

function generateActionToken() {
  return crypto.randomBytes(16).toString("hex");
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function generateTodayDoses() {
  const today = getTodayDateString();
  const medications = db.get("medications").value();

  medications.forEach((medication) => {
    const withinSchedule = medication.startDate <= today && (!medication.endDate || medication.endDate >= today);
    if (!withinSchedule) {
      return;
    }

    medication.doseTimes.forEach((time) => {
      const scheduledTime = `${today}T${time}:00`;
      const alreadyExists = db.get("doses").find({ medicationId: medication.id, scheduledTime }).value();

      if (!alreadyExists) {
        db.get("doses")
          .push({
            id: `${medication.id}-${today}-${time}`,
            medicationId: medication.id,
            userId: medication.userId,
            scheduledTime,
            status: "pending",
            notifiedAt: null,
            followUpSentAt: null,
            takenAt: null,
            actionToken: null,
          })
          .write();
      }
    });
  });
}

async function sendPush(userId, payload) {
  const user = db.get("users").find({ id: userId }).value();

  if (!user || !user.pushSubscription) {
    return;
  }

  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  } catch (error) {
    console.error(`Push notification failed for user ${userId}: ${error.message}`);
  }
}

async function checkOnTimeReminders() {
  const now = new Date();
  const pendingDoses = db.get("doses").filter({ status: "pending" }).value();

  for (const dose of pendingDoses) {
    const medication = db.get("medications").find({ id: dose.medicationId }).value();
    if (!medication) {
      continue;
    }

    const reminderTime = new Date(dose.scheduledTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - (medication.reminderOffsetMinutes || 0));

    if (now >= reminderTime) {
      const actionToken = generateActionToken();

      await sendPush(dose.userId, {
        title: "MediMind reminder",
        body: `Time for ${medication.name} (${medication.dosage})`,
        doseId: dose.id,
        actionToken,
      });

      db.get("doses")
        .find({ id: dose.id })
        .assign({ status: "notified", notifiedAt: now.toISOString(), actionToken })
        .write();
    }
  }
}

async function checkFollowUpReminders() {
  const now = new Date();
  const notifiedDoses = db.get("doses").filter({ status: "notified" }).value();

  for (const dose of notifiedDoses) {
    const scheduledTime = new Date(dose.scheduledTime);
    const minutesSinceScheduled = (now - scheduledTime) / (1000 * 60);

    if (minutesSinceScheduled >= FOLLOW_UP_DELAY_MINUTES && !dose.followUpSentAt) {
      const medication = db.get("medications").find({ id: dose.medicationId }).value();
      if (!medication) {
        continue;
      }

      await sendPush(dose.userId, {
        title: "MediMind follow-up",
        body: `Did you take ${medication.name}? Tap to confirm.`,
        doseId: dose.id,
        actionToken: dose.actionToken,
      });

      db.get("doses").find({ id: dose.id }).assign({ followUpSentAt: now.toISOString() }).write();
    }
  }
}

function checkAutoMissedDoses() {
  const today = getTodayDateString();
  const unresolvedDoses = db
    .get("doses")
    .filter((dose) => !dose.scheduledTime.startsWith(today) && dose.status !== "taken" && dose.status !== "missed")
    .value();

  unresolvedDoses.forEach((dose) => {
    db.get("doses").find({ id: dose.id }).assign({ status: "missed" }).write();
  });
}

async function checkAppointmentReminders() {
  const now = new Date();
  const appointments = db.get("appointments").value();

  for (const appointment of appointments) {
    const appointmentTime = new Date(`${appointment.date}T${appointment.time}:00`);
    const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntil <= 24 && hoursUntil > 0 && !appointment.reminder24hSent) {
      await sendPush(appointment.userId, {
        title: "MediMind appointment reminder",
        body: `Appointment at ${appointment.clinicName} in 24 hours`,
      });
      db.get("appointments").find({ id: appointment.id }).assign({ reminder24hSent: true }).write();
    }

    if (hoursUntil <= 1 && hoursUntil > 0 && !appointment.reminder1hSent) {
      await sendPush(appointment.userId, {
        title: "MediMind appointment reminder",
        body: `Appointment at ${appointment.clinicName} in 1 hour`,
      });
      db.get("appointments").find({ id: appointment.id }).assign({ reminder1hSent: true }).write();
    }
  }
}

function startNotificationScheduler() {
  cron.schedule("* * * * *", async () => {
    generateTodayDoses();
    checkAutoMissedDoses();
    await checkOnTimeReminders();
    await checkFollowUpReminders();
    await checkAppointmentReminders();
  });
}

module.exports = startNotificationScheduler;