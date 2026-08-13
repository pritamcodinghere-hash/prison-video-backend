const express = require("express");

const {
    createPrison,
    getPrisons
} = require("../controllers/prisonController");

const router = express.Router();

router.post("/", createPrison);
router.get("/", getPrisons);

module.exports = router;