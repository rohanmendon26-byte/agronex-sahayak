const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    parseVoiceRequest
} = require("../controllers/voiceController");

const router = express.Router();

router.post(
    "/parse-request",
    authenticate,
    authorize("SENIOR", "POLICE_ADMIN"),
    parseVoiceRequest
);

module.exports = router;
