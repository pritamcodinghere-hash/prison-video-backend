const prisma = require("../config/prisma");

// ==========================================
// CREATE RECORDING
// ==========================================

const createRecording = async (req, res) => {
    try {
        const {
            callId,
            fileName,
            storagePath,
            duration
        } = req.body;

        if (!callId || !fileName || !storagePath) {
            return res.status(400).json({
                message: "callId, fileName and storagePath are required"
            });
        }

        // Check call
        const call = await prisma.call.findUnique({
            where: {
                id: Number(callId)
            }
        });

        if (!call) {
            return res.status(404).json({
                message: "Call not found"
            });
        }

        // Recording should belong to a completed call
        if (call.status !== "COMPLETED") {
            return res.status(400).json({
                message: "Recording can only be created for completed calls"
            });
        }

        // Check if recording already exists
        const existingRecording = await prisma.recording.findUnique({
            where: {
                callId: Number(callId)
            }
        });

        if (existingRecording) {
            return res.status(409).json({
                message: "Recording already exists for this call",
                recording: existingRecording
            });
        }

        const recording = await prisma.recording.create({
            data: {
                callId: Number(callId),
                fileName,
                storagePath,
                duration: duration ? Number(duration) : null,
                status: "PROCESSING"
            }
        });

        return res.status(201).json({
            message: "Recording created successfully",
            recording
        });

    } catch (error) {
        console.error("CREATE RECORDING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// GET RECORDING BY CALL
// ==========================================

const getRecordingByCall = async (req, res) => {
    try {
        const callId = Number(req.params.callId);

        const recording = await prisma.recording.findUnique({
            where: {
                callId
            }
        });

        if (!recording) {
            return res.status(404).json({
                message: "Recording not found"
            });
        }

        return res.status(200).json({
            message: "Recording fetched successfully",
            recording
        });

    } catch (error) {
        console.error("GET RECORDING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE RECORDING STATUS
// ==========================================

const updateRecordingStatus = async (req, res) => {
    try {
        const recordingId = Number(req.params.id);
        const {
            status,
            duration
        } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "status is required"
            });
        }

        const allowedStatuses = [
            "PROCESSING",
            "READY",
            "FAILED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid recording status"
            });
        }

        const recording = await prisma.recording.findUnique({
            where: {
                id: recordingId
            }
        });

        if (!recording) {
            return res.status(404).json({
                message: "Recording not found"
            });
        }

        const updatedRecording = await prisma.recording.update({
            where: {
                id: recordingId
            },
            data: {
                status,
                duration:
                    duration !== undefined
                        ? Number(duration)
                        : recording.duration
            }
        });

        return res.status(200).json({
            message: "Recording status updated successfully",
            recording: updatedRecording
        });

    } catch (error) {
        console.error("UPDATE RECORDING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
// ==========================================
// UPLOAD ACTUAL RECORDING FILE
// ==========================================

const uploadRecording = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Recording file is required"
            });
        }

        const callId = Number(req.body.callId);

        if (!callId) {
            return res.status(400).json({
                message: "callId is required"
            });
        }

        // Check call
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

        // Recording should belong to completed call
        if (call.status !== "COMPLETED") {
            return res.status(400).json({
                message: "Recording can only be uploaded for completed calls"
            });
        }

        // Check if recording already exists
        const existingRecording = await prisma.recording.findUnique({
            where: {
                callId
            }
        });

        if (existingRecording) {

            return res.status(409).json({
                message: "Recording already exists for this call",
                recording: existingRecording
            });

        }

        const recording = await prisma.recording.create({
            data: {
                callId,
                fileName: req.file.filename,
                storagePath: req.file.path,
                duration: req.body.duration
                    ? Number(req.body.duration)
                    : null,
                status: "READY"
            }
        });

        return res.status(201).json({
            message: "Recording uploaded successfully",
            recording
        });

    } catch (error) {

        console.error("UPLOAD RECORDING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

module.exports = {
    createRecording,
    getRecordingByCall,
    updateRecordingStatus,
    uploadRecording
};