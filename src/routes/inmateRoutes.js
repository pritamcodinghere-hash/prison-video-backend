const express = require("express");
const { createInmate, getInmates } = require("../controllers/inmateController");
const { getInmateById, getInmateContacts } = require("../controllers/inmateProfileController");

const router = express.Router();

router.post("/", createInmate);
router.get("/", getInmates);
router.get("/:id", getInmateById);
router.get("/:id/contacts", getInmateContacts);

module.exports = router;
