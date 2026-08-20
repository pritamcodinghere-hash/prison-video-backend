const express = require("express");
const { createFamilyMember, sendOtp, verifyOtp } = require("../controllers/familyController");
const { registerDevice, verifyDevice } = require("../controllers/deviceRegistrationController");

const router = express.Router();

router.post("/", createFamilyMember);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/device-register", registerDevice);
router.post("/device-verify", verifyDevice);

module.exports = router;
