const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getAuditLogs,
    deleteAuditLog
} = require("../controllers/auditController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("POLICE_ADMIN"),
    getAuditLogs
);

router.delete(
    "/:id",
    authenticate,
    authorize("POLICE_ADMIN"),
    deleteAuditLog
);

module.exports = router;