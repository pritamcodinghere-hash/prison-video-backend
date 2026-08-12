const express = require("express");

const {
    createInmate,
    getInmates
} = require("../controllers/inmateController");

const router = express.Router();

router.post("/", createInmate);
router.get("/", getInmates);

module.exports = router;