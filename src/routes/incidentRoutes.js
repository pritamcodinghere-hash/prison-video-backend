const express = require("express");
const { createIncident, getIncidents, updateIncidentStatus } = require("../controllers/incidentController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getIncidents);
router.post("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), createIncident);
router.patch("/:id/status", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), updateIncidentStatus);

module.exports = router;
