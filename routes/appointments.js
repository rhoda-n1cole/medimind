const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const user = db.get("users").find({ id: req.userId }).value();

  const targetUserId = user.role === "caregiver" ? user.linkedPatientId : req.userId;
  if (!targetUserId) {
    return res.json([]);
  }

  const appointments = db.get("appointments").filter({ userId: targetUserId }).value();
  res.json(appointments);
});

router.post("/", (req, res) => {
  const { date, time, clinicName, notes } = req.body;

  if (!date || !time || !clinicName) {
    return res.status(400).json({ message: "Date, time, and clinic name are required" });
  }

  const newAppointment = {
    id: Date.now().toString(),
    userId: req.userId,
    date,
    time,
    clinicName,
    notes: notes || "",
    reminder24hSent: false,
    reminder1hSent: false,
    createdAt: new Date().toISOString(),
  };

  db.get("appointments").push(newAppointment).write();
  res.status(201).json(newAppointment);
});

module.exports = router;