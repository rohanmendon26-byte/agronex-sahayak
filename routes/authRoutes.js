const express = require("express");

const {
    registerVolunteer,
    loginVolunteer,
    loginAdmin,
    registerSenior,
    loginSenior
} = require("../controllers/authController");

const router = express.Router();

router.post("/volunteer/register", registerVolunteer);
router.post("/volunteer/login", loginVolunteer);
router.post("/admin/login", loginAdmin);
router.post("/senior/register", registerSenior);
router.post("/senior/login", loginSenior);

module.exports = router;