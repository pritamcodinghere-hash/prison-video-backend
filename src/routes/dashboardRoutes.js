const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN"), getDashboardStats);

module.exports = router;
