const express = require("express");

const { loginUser } = require("../controllers/authController");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);



module.exports = router;