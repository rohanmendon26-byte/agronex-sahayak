const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getAuditLogs
} = require("../controllers/auditController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("POLICE_ADMIN"),
    getAuditLogs
);

module.exports = router;