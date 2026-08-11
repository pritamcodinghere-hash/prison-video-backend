const prisma = require("../config/prisma");

const createSchedule = async (req, res) => {
    try {
        const {
            inmateId,
            familyMemberId,
            scheduledAt,
            duration
        } = req.body;

        // Validate fields
        if (
            !inmateId ||
            !familyMemberId ||
            !scheduledAt ||
            !duration
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check inmate
        const inmate = await prisma.inmate.findUnique({
            where: {
                id: Number(inmateId)
            }
        });

        if (!inmate) {
            return res.status(404).json({
                message: "Inmate not found"
            });
        }

        // Check family member
        const familyMember = await prisma.familyMember.findUnique({
            where: {
                id: Number(familyMemberId)
            }
        });

        if (!familyMember) {
            return res.status(404).json({
                message: "Family member not found"
            });
        }

        // Family member must be verified
        if (familyMember.verificationStatus !== "VERIFIED") {
            return res.status(403).json({
                message: "Family member is not verified"
            });
        }

        // Make sure family member belongs to this inmate
        if (familyMember.inmateId !== Number(inmateId)) {
            return res.status(403).json({
                message: "Family member is not associated with this inmate"
            });
        }

        // Validate duration
        if (Number(duration) <= 0) {
            return res.status(400).json({
                message: "Duration must be greater than 0"
            });
        }

        // Validate scheduled time
        const scheduleTime = new Date(scheduledAt);

        if (isNaN(scheduleTime.getTime())) {
            return res.status(400).json({
                message: "Invalid scheduledAt"
            });
        }

        if (scheduleTime <= new Date()) {
            return res.status(400).json({
                message: "Scheduled time must be in the future"
            });
        }

        // Create schedule
        const schedule = await prisma.callSchedule.create({
            data: {
                inmateId: Number(inmateId),
                familyMemberId: Number(familyMemberId),
                scheduledAt: scheduleTime,
                duration: Number(duration),
                status: "SCHEDULED"
            }
        });

        return res.status(201).json({
            message: "Call scheduled successfully",
            schedule
        });

    } catch (error) {
        console.error("CREATE SCHEDULE ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET FAMILY MEMBER SCHEDULES
// ==========================================

const getFamilySchedules = async (req, res) => {
    try {
        const familyMemberId = Number(req.params.familyMemberId);

        const schedules = await prisma.callSchedule.findMany({
            where: {
                familyMemberId
            },
            include: {
                inmate: true
            },
            orderBy: {
                scheduledAt: "asc"
            }
        });

        return res.status(200).json({
            message: "Schedules fetched successfully",
            schedules
        });

    } catch (error) {
        console.error("GET FAMILY SCHEDULES ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// GET INMATE SCHEDULES
// ==========================================

const getInmateSchedules = async (req, res) => {
    try {
        const inmateId = Number(req.params.inmateId);

        const schedules = await prisma.callSchedule.findMany({
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
                }
            },
            orderBy: {
                scheduledAt: "asc"
            }
        });

        return res.status(200).json({
            message: "Schedules fetched successfully",
            schedules
        });

    } catch (error) {
        console.error("GET INMATE SCHEDULES ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// CANCEL SCHEDULE
// ==========================================

const cancelSchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);

        const schedule = await prisma.callSchedule.findUnique({
            where: {
                id: scheduleId
            }
        });

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found"
            });
        }

        if (schedule.status === "CANCELLED") {
            return res.status(400).json({
                message: "Schedule is already cancelled"
            });
        }

        if (schedule.status === "COMPLETED") {
            return res.status(400).json({
                message: "Completed schedule cannot be cancelled"
            });
        }

        const updatedSchedule = await prisma.callSchedule.update({
            where: {
                id: scheduleId
            },
            data: {
                status: "CANCELLED"
            }
        });

        return res.status(200).json({
            message: "Schedule cancelled successfully",
            schedule: updatedSchedule
        });

    } catch (error) {
        console.error("CANCEL SCHEDULE ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createSchedule,
    getFamilySchedules,
    getInmateSchedules,
    cancelSchedule
};