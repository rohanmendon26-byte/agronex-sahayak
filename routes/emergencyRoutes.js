const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createEmergency
} = require("../controllers/emergencyController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("POLICE_ADMIN"),
    createEmergency
);

module.exports = router;