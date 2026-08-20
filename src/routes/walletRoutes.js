const express = require("express");
const { getWallet, deposit, deduct } = require("../controllers/walletController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:userId", authenticateToken, getWallet);
router.post("/:userId/deposit", authenticateToken, deposit);
router.post("/:userId/deduct", authenticateToken, deduct);

module.exports = router;
