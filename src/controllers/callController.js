const crypto = require("crypto");
const prisma = require("../config/prisma");

// ==========================================
// CREATE CALL FROM SCHEDULE
// ==========================================

const createCall = async (req, res) => {
    try {
        const { scheduleId } = req.body;

        if (!scheduleId) {
            return res.status(400).json({
                message: "scheduleId is required"
            });
        }

        const schedule = await prisma.callSchedule.findUnique({
            where: {
                id: Number(scheduleId)
            }
        });

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found"
            });
        }

        if (schedule.status !== "SCHEDULED") {
            return res.status(400).json({
                message: "Only scheduled calls can be started"
            });
        }

        // Check if a call already exists for this schedule
        const existingCall = await prisma.call.findUnique({
            where: {
                scheduleId: Number(scheduleId)
            }
        });

        if (existingCall) {
            return res.status(409).json({
                message: "Call already exists for this schedule",
                call: existingCall
            });
        }

        // Generate unique room ID
        const roomId = `room_${crypto.randomBytes(8).toString("hex")}`;

        const call = await prisma.call.create({
            data: {
                scheduleId: Number(scheduleId),
                inmateId: schedule.inmateId,
                familyMemberId: schedule.familyMemberId,
                roomId,
                status: "WAITING"
            }
        });

        return res.status(201).json({
            message: "Call created successfully",
            call
        });

    } catch (error) {
        console.error("CREATE CALL ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET CALL BY ID
// ==========================================

const getCallById = async (req, res) => {
    try {
        const callId = Number(req.params.id);

        const call = await prisma.call.findUnique({
            where: {
                id: callId
            },
            include: {
                inmate: true,
                familyMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    }
                },
                schedule: true
            }
        });

        if (!call) {
            return res.status(404).json({
                message: "Call not found"
            });
        }

        return res.status(200).json({
            message: "Call fetched successfully",
            call
        });

    } catch (error) {
        console.error("GET CALL ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// START CALL
// ==========================================

const startCall = async (req, res) => {
    try {
        const callId = Number(req.params.id);

        const call = await prisma.call.findUnique({
            where: {
                id: callId
            }
        });

        if (!call) {
            return res.status(404).json({
                message: "Call not found"
            });
        }

        if (call.status !== "WAITING") {
            return res.status(400).json({
                message: "Call cannot be started in its current state"
            });
        }

        const updatedCall = await prisma.call.update({
            where: {
                id: callId
            },
            data: {
                status: "ACTIVE",
                startedAt: new Date()
            }
        });

        return res.status(200).json({
            message: "Call started successfully",
            call: updatedCall
        });

    } catch (error) {
        console.error("START CALL ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// END CALL
// ==========================================

const endCall = async (req, res) => {
    try {
        const callId = Number(req.params.id);

        const call = await prisma.call.findUnique({
            where: {
                id: callId
            }
        });

        if (!call) {
            return res.status(404).json({
                message: "Call not found"
            });
        }

        if (call.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Only active calls can be ended"
            });
        }

        const endedAt = new Date();

        let duration = 0;

        if (call.startedAt) {
            duration = Math.max(
                1,
                Math.floor(
                    (endedAt.getTime() - call.startedAt.getTime()) / 1000
                )
            );
        }

        const updatedCall = await prisma.call.update({
            where: {
                id: callId
            },
            data: {
                status: "COMPLETED",
                endedAt,
                duration
            }
        });

        // Also mark schedule as completed
        if (call.scheduleId) {
            await prisma.callSchedule.update({
                where: {
                    id: call.scheduleId
                },
                data: {
                    status: "COMPLETED"
                }
            });
        }

        return res.status(200).json({
            message: "Call ended successfully",
            call: updatedCall
        });

    } catch (error) {
        console.error("END CALL ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET CALLS FOR INMATE
// ==========================================

const getInmateCalls = async (req, res) => {
    try {
        const inmateId = Number(req.params.inmateId);

        const calls = await prisma.call.findMany({
            where: {
                inmateId
            },
            include: {
                familyMember: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    }
                },
                schedule: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Inmate calls fetched successfully",
            calls
        });

    } catch (error) {
        console.error("GET INMATE CALLS ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET CALLS FOR FAMILY MEMBER
// ==========================================

const getFamilyCalls = async (req, res) => {
    try {
        const familyMemberId = Number(req.params.familyMemberId);

        const calls = await prisma.call.findMany({
            where: {
                familyMemberId
            },
            include: {
                inmate: true,
                schedule: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Family calls fetched successfully",
            calls
        });

    } catch (error) {
        console.error("GET FAMILY CALLS ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createCall,
    getCallById,
    startCall,
    endCall,
    getInmateCalls,
    getFamilyCalls
};