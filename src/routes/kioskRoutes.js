const express = require("express");
const { verifyKiosk, registerKiosk, getRegistrationStatus, getKiosks, updateKioskStatus } = require("../controllers/kioskController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/verify", verifyKiosk);
router.post("/register", authenticateToken, registerKiosk);
router.get("/registration-status/:serialNumber", getRegistrationStatus);
router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getKiosks);
router.patch("/:id/status", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), updateKioskStatus);

module.exports = router;
