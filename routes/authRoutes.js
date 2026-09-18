const express = require("express");

const {
    registerVolunteer,
    loginVolunteer,
    loginAdmin
} = require("../controllers/authController");

const router = express.Router();

router.post("/volunteer/register", registerVolunteer);
router.post("/volunteer/login", loginVolunteer);
router.post("/admin/login", loginAdmin);

module.exports = router;