const express = require("express");
const { registerUser } = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

// Protected test route
router.get("/profile", authenticateToken, (req, res) => {
    res.json({
        message: "Authenticated successfully",
        user: req.user
    });
});

module.exports = router;