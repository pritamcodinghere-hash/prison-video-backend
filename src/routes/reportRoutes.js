const express = require("express");
const { getCallStats } = require("../controllers/reportController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, requireRole("WARDEN", "ADMIN", "SUPER_ADMIN", "VENDOR"), getCallStats);

module.exports = router;
