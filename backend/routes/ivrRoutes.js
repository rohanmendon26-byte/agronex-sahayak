const express = require("express");
const router = express.Router();
const { getIvrMenuOptions, handleIncomingCall } = require("../controllers/ivrController");

// Get IVR Helpline Options
router.get("/options", getIvrMenuOptions);

// Handle Incoming Keypad Phone IVR Call (JSON or Twilio Webhook)
router.post("/incoming-call", handleIncomingCall);

module.exports = router;
