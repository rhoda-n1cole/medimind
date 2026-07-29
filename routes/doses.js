const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/subscribe", (req, res) => {
  const { pushSubscription } = req.body;

  if (!pushSubscription) {
    return res.status(400).json({ message: "pushSubscription is required" });
  }

  db.get("users").find({ id: req.userId }).assign({ pushSubscription }).write();
  res.status(204).end();
});

router.post("/:id/confirm", (req, res) => {
  const dose = db.get("doses").find({ id: req.params.id, userId: req.userId }).value();

  if (!dose) {
    return res.status(404).json({ message: "Dose not found" });
  }

  db.get("doses").find({ id: req.params.id }).assign({ status: "taken", takenAt: new Date().toISOString() }).write();
  res.status(204).end();
});

router.post("/:id/snooze", (req, res) => {
  const dose = db.get("doses").find({ id: req.params.id, userId: req.userId }).value();

  if (!dose) {
    return res.status(404).json({ message: "Dose not found" });
  }

  const newScheduledTime = new Date(dose.scheduledTime);
  newScheduledTime.setMinutes(newScheduledTime.getMinutes() + 10);

  db.get("doses")
    .find({ id: req.params.id })
    .assign({ scheduledTime: newScheduledTime.toISOString(), status: "pending", notifiedAt: null })
    .write();

  res.status(204).end();
});

module.exports = router;