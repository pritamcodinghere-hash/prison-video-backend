const express = require("express");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getSettings);
router.patch("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), updateSettings);

module.exports = router;
