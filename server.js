require("dotenv").config();

const express = require("express");
const path = require("path");
const authRoutes = require("./routes/auth");
const medicationRoutes = require("./routes/medications");
const doseRoutes = require("./routes/doses");
const startNotificationScheduler = require("./services/notificationService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/doses", doseRoutes);

app.get("/api/config/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

startNotificationScheduler();

app.listen(PORT, () => {
  console.log(`MediMind server running on port ${PORT}`);
});