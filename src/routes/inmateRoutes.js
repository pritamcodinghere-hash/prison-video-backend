const express = require("express");
const { createInmate } = require("../controllers/inmateController");

const router = express.Router();

router.post("/", createInmate);

module.exports = router;