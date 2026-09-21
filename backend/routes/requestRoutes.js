const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createRequest,
    getRequests,
    assignVolunteer,
    updateRequestStatus
} = require("../controllers/requestController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("SENIOR", "POLICE_ADMIN"),
    createRequest
);

router.get(
    "/",
    authenticate,
    authorize("SENIOR", "VOLUNTEER", "POLICE_ADMIN"),
    getRequests
);

router.patch(
    "/:id/assign",
    authenticate,
    authorize("POLICE_ADMIN"),
    assignVolunteer
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("VOLUNTEER", "POLICE_ADMIN"),
    updateRequestStatus
);

module.exports = router;