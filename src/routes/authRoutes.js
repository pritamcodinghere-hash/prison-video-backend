const express = require("express");

const {
    loginUser,
    getMe,
    logoutUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword
} = require("../controllers/authController");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.post("/logout", authenticateToken, logoutUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;
