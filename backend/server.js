const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const auditRoutes = require("./routes/auditRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
require("dotenv").config();

const connectDB = require("./config/db");
require("./models/User");

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/voice", voiceRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AgroNex Sahayak Backend is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});