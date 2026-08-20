const express = require("express");
const { getAlerts, resolveAlert, createAlert } = require("../controllers/alertController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getAlerts);
router.post("/", authenticateToken, createAlert);
router.patch("/:id/resolve", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), resolveAlert);

module.exports = router;
