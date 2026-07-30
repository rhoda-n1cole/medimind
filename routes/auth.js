const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 10;

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "dev-secret-change-in-production",
    { expiresIn: "7d" }
  );
}

function generateLinkCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/register", async (req, res) => {
  const { fullName, email, phoneNumber, password, linkCode } = req.body;

  if (!fullName || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = db.get("users").find({ email }).value();
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  let linkedPatientId = null;
  let role = "patient";

  if (linkCode) {
    const patient = db.get("users").find({ linkCode }).value();
    if (!patient) {
      return res.status(400).json({ message: "Invalid caregiver code" });
    }
    role = "caregiver";
    linkedPatientId = patient.id;
    db.get("users").find({ id: patient.id }).assign({ linkCode: null }).write();
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    phoneNumber,
    passwordHash,
    role,
    linkCode: null,
    linkedPatientId,
    createdAt: new Date().toISOString(),
  };

  db.get("users").push(newUser).write();

  const token = generateToken(newUser.id);
  res.status(201).json({ token, role });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = db.get("users").find({ email }).value();
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user.id);
  res.json({ token, role: user.role || "patient" });
});

router.post("/link-code", requireAuth, (req, res) => {
  const code = generateLinkCode();

  db.get("users").find({ id: req.userId }).assign({ linkCode: code }).write();

  res.json({ code });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.get("users").find({ id: req.userId }).value();
  res.json({ role: user.role || "patient", linkedPatientId: user.linkedPatientId || null });
});

module.exports = router;