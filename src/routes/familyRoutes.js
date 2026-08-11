const express = require("express");

const {
    createFamilyMember,
    sendOtp,
    verifyOtp
} = require("../controllers/familyController");

const router = express.Router();

router.post("/", createFamilyMember);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

module.exports = router;