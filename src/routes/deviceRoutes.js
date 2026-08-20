const express = require("express");
const { getDevices, createDevice, updateDeviceStatus } = require("../controllers/deviceController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getDevices);
router.post("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), createDevice);
router.patch("/:id/status", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), updateDeviceStatus);

module.exports = router;
