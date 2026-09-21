const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getVolunteers,
    verifyVolunteer,
    activateVolunteer,
    updateAvailability
} = require("../controllers/volunteerController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("POLICE_ADMIN"),
    getVolunteers
);

router.patch(
    "/:id/verify",
    authenticate,
    authorize("POLICE_ADMIN"),
    verifyVolunteer
);

router.patch(
    "/:id/activate",
    authenticate,
    authorize("POLICE_ADMIN"),
    activateVolunteer
);

router.patch(
    "/availability",
    authenticate,
    authorize("VOLUNTEER"),
    updateAvailability
);

module.exports = router;