const express = require("express");

const {
    createSchedule,
    getFamilySchedules,
    getInmateSchedules,
    cancelSchedule
} = require("../controllers/scheduleController");

const router = express.Router();

router.post("/", createSchedule);

router.get("/family/:familyMemberId", getFamilySchedules);

router.get("/inmate/:inmateId", getInmateSchedules);

router.patch("/:id/cancel", cancelSchedule);

module.exports = router;