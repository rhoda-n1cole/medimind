const cron = require("node-cron");
const webpush = require("web-push");
const db = require("../db");

webpush.setVapidDetails(
  "mailto:admin@medimind.example",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const FOLLOW_UP_DELAY_MINUTES = 30;

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
      await sendPush(dose.userId, {
        title: "MediMind reminder",
        body: `Time for ${medication.name} (${medication.dosage})`,
        doseId: dose.id,
      });

      db.get("doses").find({ id: dose.id }).assign({ status: "notified", notifiedAt: now.toISOString() }).write();
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
      });

      db.get("doses").find({ id: dose.id }).assign({ followUpSentAt: now.toISOString() }).write();
    }
  }
}

function startNotificationScheduler() {
  cron.schedule("* * * * *", async () => {
    generateTodayDoses();
    await checkOnTimeReminders();
    await checkFollowUpReminders();
  });
}

module.exports = startNotificationScheduler;