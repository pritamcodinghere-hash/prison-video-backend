const express = require("express");

const {
    createBilling,
    getBillingByCall,
    updateBillingStatus
} = require("../controllers/billingController");

const router = express.Router();

router.post("/", createBilling);

router.get("/call/:callId", getBillingByCall);

router.patch("/:id/status", updateBillingStatus);

module.exports = router;