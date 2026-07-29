const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const medications = db.get("medications").filter({ userId: req.userId }).value();
  res.json(medications);
});

router.post("/", (req, res) => {
  const { name, dosage, frequency, startDate, endDate, doseTimes } = req.body;

  if (!name || !dosage || !frequency || !startDate) {
    return res.status(400).json({ message: "Name, dosage, frequency, and start date are required" });
  }

  if (!Array.isArray(doseTimes) || doseTimes.length === 0) {
    return res.status(400).json({ message: "At least one dose time is required" });
  }

  const newMedication = {
    id: Date.now().toString(),
    userId: req.userId,
    name,
    dosage,
    frequency,
    startDate,
    endDate: endDate || null,
    doseTimes,
    reminderOffsetMinutes: Number(req.body.reminderOffsetMinutes) || 0,
    createdAt: new Date().toISOString(),
  };

  db.get("medications").push(newMedication).write();
  res.status(201).json(newMedication);
});

router.put("/:id", (req, res) => {
  const medication = db.get("medications").find({ id: req.params.id, userId: req.userId }).value();

  if (!medication) {
    return res.status(404).json({ message: "Medication not found" });
  }

  const { name, dosage, frequency, startDate, endDate, doseTimes } = req.body;

  if (!name || !dosage || !frequency || !startDate) {
    return res.status(400).json({ message: "Name, dosage, frequency, and start date are required" });
  }

  if (!Array.isArray(doseTimes) || doseTimes.length === 0) {
    return res.status(400).json({ message: "At least one dose time is required" });
  }

  db.get("medications")
    .find({ id: req.params.id })
    .assign({
      name,
      dosage,
      frequency,
      startDate,
      endDate: endDate || null,
      doseTimes,
      reminderOffsetMinutes: Number(req.body.reminderOffsetMinutes) || 0,
    })
    .write();

  res.json(db.get("medications").find({ id: req.params.id }).value());
});

router.delete("/:id", (req, res) => {
  const medication = db.get("medications").find({ id: req.params.id, userId: req.userId }).value();

  if (!medication) {
    return res.status(404).json({ message: "Medication not found" });
  }

  db.get("medications").remove({ id: req.params.id }).write();
  db.get("doses").remove({ medicationId: req.params.id }).write();
  res.status(204).end();
});

module.exports = router;