
const crypto = require("crypto");
const prisma = require("../config/prisma");

const {
    createMediaRoom,
    closeMediaRoom
} = require("../services/mediaServerClient");

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

        // Generate unique media room ID
        const roomId =
            `room_${crypto.randomBytes(8).toString("hex")}`;

        // Create call in database first
        const call = await prisma.call.create({
            data: {
                scheduleId: Number(scheduleId),
                inmateId: schedule.inmateId,
                familyMemberId: schedule.familyMemberId,
                roomId,
                status: "WAITING"
            }
        });

        // Create corresponding room on Media Server
        try {

            const mediaRoom =
                await createMediaRoom(roomId);

            console.log(
                "Media room created:",
                mediaRoom.roomId
            );

        } catch (mediaError) {

            console.error(
                "MEDIA ROOM CREATION ERROR:",
                mediaError
            );

            // Roll back database call if media room
            // could not be created
            await prisma.call.delete({
                where: {
                    id: call.id
                }
            });

            return res.status(503).json({
                message:
                    "Media Server unavailable. Call was not created.",
                error: mediaError.message
            });
        }

        return res.status(201).json({
            message: "Call and media room created successfully",
            call
        });

    } catch (error) {

        console.error(
            "CREATE CALL ERROR:",
            error
        );

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

        console.error(
            "GET CALL ERROR:",
            error
        );

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
                message:
                    "Call cannot be started in its current state"
            });
        }

        if (!call.roomId) {
            return res.status(400).json({
                message:
                    "Call does not have a media room"
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

        console.error(
            "START CALL ERROR:",
            error
        );

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
                message:
                    "Only active calls can be ended"
            });
        }

        const endedAt = new Date();

        let duration = 0;

        if (call.startedAt) {

            duration = Math.max(
                1,
                Math.floor(
                    (
                        endedAt.getTime() -
                        call.startedAt.getTime()
                    ) / 1000
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

        // Mark schedule completed
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

        // Close corresponding media room
        if (call.roomId) {

            try {

                await closeMediaRoom(call.roomId);

                console.log(
                    "Media room closed:",
                    call.roomId
                );

            } catch (mediaError) {

                console.error(
                    "MEDIA ROOM CLOSE ERROR:",
                    mediaError
                );

                // The call is already completed in DB,
                // so don't fail the API response.
            }
        }

        return res.status(200).json({
            message:
                "Call ended successfully",
            call: updatedCall
        });

    } catch (error) {

        console.error(
            "END CALL ERROR:",
            error
        );

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

        const inmateId =
            Number(req.params.inmateId);

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
            message:
                "Inmate calls fetched successfully",
            calls
        });

    } catch (error) {

        console.error(
            "GET INMATE CALLS ERROR:",
            error
        );

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

        const familyMemberId =
            Number(req.params.familyMemberId);

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
            message:
                "Family calls fetched successfully",
            calls
        });

    } catch (error) {

        console.error(
            "GET FAMILY CALLS ERROR:",
            error
        );

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
