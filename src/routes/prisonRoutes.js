const express = require("express");
const { createPrison } = require("../controllers/prisonController");

const router = express.Router();

router.post("/", createPrison);

module.exports = router;