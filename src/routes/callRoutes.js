const express = require("express");

const {
    createCall,
    getCallById,
    startCall,
    endCall,
    getInmateCalls,
    getFamilyCalls
} = require("../controllers/callController");

const router = express.Router();

router.post("/", createCall);

router.get("/inmate/:inmateId", getInmateCalls);

router.get("/family/:familyMemberId", getFamilyCalls);

router.get("/:id", getCallById);

router.post("/:id/start", startCall);

router.post("/:id/end", endCall);

module.exports = router;