const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getVolunteerProfile,
    getVolunteers,
    verifyVolunteer,
    activateVolunteer,
    updateAvailability,
    updateLocation,
    deleteVolunteer
} = require("../controllers/volunteerController");

const router = express.Router();

router.get(
    "/me",
    authenticate,
    authorize("VOLUNTEER"),
    getVolunteerProfile
);

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

router.patch(
    "/location",
    authenticate,
    authorize("VOLUNTEER"),
    updateLocation
);

router.delete(
    "/:id",
    authenticate,
    authorize("POLICE_ADMIN"),
    deleteVolunteer
);

module.exports = router;