const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    createRecording,
    getRecordingByCall,
    updateRecordingStatus,
    uploadRecording
} = require("../controllers/recordingController");

const router = express.Router();

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "recordings/");
    },

   filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".webm";

    cb(
        null,
        `recording_${Date.now()}${extension}`
    );
}
});

const upload = multer({
    storage,

    limits: {
        fileSize: 500 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "video/webm",
            "video/mp4",
            "audio/webm",
            "audio/wav",
            "audio/mpeg"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only WebM, MP4, WAV and MP3 files are allowed"
                )
            );
        }
    }
});

// ==========================================
// UPLOAD RECORDING
// ==========================================

router.post(
    "/upload",
    upload.single("recording"),
    uploadRecording
);

// ==========================================
// CREATE RECORDING METADATA
// ==========================================

router.post(
    "/",
    createRecording
);

// ==========================================
// GET RECORDING BY CALL
// ==========================================

router.get(
    "/call/:callId",
    getRecordingByCall
);

// ==========================================
// UPDATE RECORDING STATUS
// ==========================================

router.patch(
    "/:id/status",
    updateRecordingStatus
);

module.exports = router;