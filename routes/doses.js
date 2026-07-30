const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

function getTargetUserId(req) {
  const user = db.get("users").find({ id: req.userId }).value();
  return user.role === "caregiver" ? user.linkedPatientId : req.userId;
}

function verifyDoseAction(req, res, next) {
  const dose = db.get("doses").find({ id: req.params.id }).value();

  if (dose && dose.actionToken && req.body.actionToken === dose.actionToken) {
    req.userId = dose.userId;
    return next();
  }

  return requireAuth(req, res, next);
}

router.get("/today", requireAuth, (req, res) => {
  const targetUserId = getTargetUserId(req);
  if (!targetUserId) {
    return res.json([]);
  }

  const today = new Date().toISOString().split("T")[0];
  const todaysDoses = db
    .get("doses")
    .filter((dose) => dose.userId === targetUserId && dose.scheduledTime.startsWith(today))
    .value();

  const checklist = todaysDoses.map((dose) => {
    const medication = db.get("medications").find({ id: dose.medicationId }).value();
    return {
      id: dose.id,
      medicationName: medication ? medication.name : "Unknown medication",
      scheduledTime: dose.scheduledTime,
      status: dose.status,
      takenAt: dose.takenAt,
    };
  });

  res.json(checklist);
});

router.get("/weekly-summary", requireAuth, (req, res) => {
  const targetUserId = getTargetUserId(req);
  if (!targetUserId) {
    return res.json({ taken: 0, total: 0, percentage: 0 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentDoses = db
    .get("doses")
    .filter((dose) => dose.userId === targetUserId && new Date(dose.scheduledTime) >= sevenDaysAgo)
    .value();

  const taken = recentDoses.filter((dose) => dose.status === "taken").length;
  const total = recentDoses.length;
  const percentage = total === 0 ? 0 : Math.round((taken / total) * 100);

  res.json({ taken, total, percentage });
});

router.post("/subscribe", requireAuth, (req, res) => {
  const { pushSubscription } = req.body;

  if (!pushSubscription) {
    return res.status(400).json({ message: "pushSubscription is required" });
  }

  db.get("users").find({ id: req.userId }).assign({ pushSubscription }).write();
  res.status(204).end();
});

router.post("/:id/confirm", verifyDoseAction, (req, res) => {
  const targetUserId = getTargetUserId(req);
  const dose = db.get("doses").find({ id: req.params.id, userId: targetUserId }).value();

  if (!dose) {
    return res.status(404).json({ message: "Dose not found" });
  }

  db.get("doses")
    .find({ id: req.params.id })
    .assign({ status: "taken", takenAt: new Date().toISOString(), actionToken: null })
    .write();
  res.status(204).end();
});

router.post("/:id/snooze", verifyDoseAction, (req, res) => {
  const targetUserId = getTargetUserId(req);
  const dose = db.get("doses").find({ id: req.params.id, userId: targetUserId }).value();

  if (!dose) {
    return res.status(404).json({ message: "Dose not found" });
  }

  const newScheduledTime = new Date(dose.scheduledTime);
  newScheduledTime.setMinutes(newScheduledTime.getMinutes() + 10);

  db.get("doses")
    .find({ id: req.params.id })
    .assign({ scheduledTime: newScheduledTime.toISOString(), status: "pending", notifiedAt: null, actionToken: null })
    .write();

  res.status(204).end();
});

module.exports = router;