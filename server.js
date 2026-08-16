require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const prisma = require("./src/config/prisma");

const app = express();
const server = http.createServer(app); 

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id);

    // ==========================================
    // JOIN CALL
    // ==========================================

    socket.on("join-call", async (data) => {
        try {

            const { roomId, userId, role } = data;

            // Validate input
            if (!roomId || !userId || !role) {
                socket.emit("call-error", {
                    message: "roomId, userId and role are required"
                });
                return;
            }

            // Find call using roomId
            const call = await prisma.call.findUnique({
                where: {
                    roomId
                }
            });

            // Check call exists
            if (!call) {
                socket.emit("call-error", {
                    message: "Invalid call room"
                });
                return;
            }

            // Call must be active
            if (call.status !== "ACTIVE") {
                socket.emit("call-error", {
                    message: "Call is not active"
                });
                return;
            }

            // Convert userId to number
            const numericUserId = Number(userId);

            let validParticipant = false;

            // ==========================================
            // VISITOR VALIDATION
            // ==========================================

            if (role === "VISITOR") {

                const familyMember =
                    await prisma.familyMember.findFirst({
                        where: {
                            id: call.familyMemberId,
                            userId: numericUserId
                        }
                    });

                validParticipant = !!familyMember;
            }

            // ==========================================
            // INMATE VALIDATION
            // ==========================================

            if (role === "INMATE") {

                const inmate =
                    await prisma.inmate.findFirst({
                        where: {
                            id: call.inmateId
                        }
                    });

                // Temporary identity mapping.
                // This will be improved when inmate
                // authentication is connected to a User.
                validParticipant =
                    !!inmate &&
                    inmate.id === numericUserId;
            }

            // ==========================================
            // INVALID PARTICIPANT
            // ==========================================

            if (!validParticipant) {

                socket.emit("call-error", {
                    message: "User is not authorized for this call"
                });

                return;
            }

            // ==========================================
            // JOIN SOCKET.IO ROOM
            // ==========================================

            socket.join(roomId);

            console.log(
                `User ${userId} joined call ${call.id} in room ${roomId} as ${role}`
            );

            // ==========================================
            // CONFIRM JOIN
            // ==========================================

            socket.emit("call-joined", {
                callId: call.id,
                roomId,
                userId: numericUserId,
                role
            });

            // ==========================================
            // NOTIFY OTHER PARTICIPANT
            // ==========================================

            socket.to(roomId).emit("participant-joined", {
                userId: numericUserId,
                role
            });

        } catch (error) {

            console.error(
                "JOIN CALL ERROR:",
                error
            );

            socket.emit("call-error", {
                message: "Unable to join call"
            });
        }
    });
    

    // ==========================================
    // WEBRTC OFFER
    // ==========================================

    socket.on("offer", (data) => {
        try {

            const { roomId, offer } = data;

            if (!roomId || !offer) {
                socket.emit("call-error", {
                    message: "roomId and offer are required"
                });
                return;
            }

            console.log(
                `WebRTC offer received for room ${roomId}`
            );

            // Forward offer to the other participant
            socket.to(roomId).emit("offer", {
                offer
            });

        } catch (error) {

            console.error(
                "WEBRTC OFFER ERROR:",
                error
            );

            socket.emit("call-error", {
                message: "Unable to process WebRTC offer"
            });
        }
    });
    // ==========================================
// WEBRTC ANSWER
// ==========================================

socket.on("answer", (data) => {
    try {

        const { roomId, answer } = data;

        if (!roomId || !answer) {
            socket.emit("call-error", {
                message: "roomId and answer are required"
            });
            return;
        }

        console.log(
            `WebRTC answer received for room ${roomId}`
        );

        // Forward answer to the other participant
        socket.to(roomId).emit("answer", {
            answer
        });

    } catch (error) {

        console.error(
            "WEBRTC ANSWER ERROR:",
            error
        );

        socket.emit("call-error", {
            message: "Unable to process WebRTC answer"
        });
    }
});
// ==========================================
// WEBRTC ICE CANDIDATE
// ==========================================

socket.on("ice-candidate", (data) => {
    try {

        const { roomId, candidate } = data;

        if (!roomId || !candidate) {
            socket.emit("call-error", {
                message: "roomId and candidate are required"
            });
            return;
        }

        console.log(
            `ICE candidate received for room ${roomId}`
        );

        // Forward ICE candidate to the other participant
        socket.to(roomId).emit("ice-candidate", {
            candidate
        });

    } catch (error) {

        console.error(
            "ICE CANDIDATE ERROR:",
            error
        );

        socket.emit("call-error", {
            message: "Unable to process ICE candidate"
        });
    }
});
// ==========================================
// LEAVE CALL
// ==========================================

socket.on("leave-call", (data) => {
    try {
        const { roomId, userId, role } = data;

        if (!roomId) {
            socket.emit("call-error", {
                message: "roomId is required"
            });
            return;
        }

        console.log(
            `User ${userId} left call room ${roomId}`
        );

        socket.leave(roomId);

        socket.to(roomId).emit("participant-left", {
            userId,
            role
        });

    } catch (error) {

        console.error(
            "LEAVE CALL ERROR:",
            error
        );

        socket.emit("call-error", {
            message: "Unable to leave call"
        });
    }
});
// ==========================================
// END CALL
// ==========================================

socket.on("end-call", async (data) => {
    try {

        const { roomId, userId } = data;

        // Validate input
        if (!roomId || !userId) {

            socket.emit("call-error", {
                message: "roomId and userId are required"
            });

            return;
        }

        // Find call
        const call = await prisma.call.findUnique({
            where: {
                roomId
            }
        });

        // Check call exists
        if (!call) {

            socket.emit("call-error", {
                message: "Invalid call room"
            });

            return;
        }

        // Check call status
        if (call.status === "ENDED") {

            socket.emit("call-error", {
                message: "Call has already ended"
            });

            return;
        }

        // Calculate duration
        let duration = null;

        if (call.startedAt) {

            duration = Math.floor(
                (new Date() - new Date(call.startedAt)) / 1000
            );

        }

        // Update call
        const updatedCall =
            await prisma.call.update({
                where: {
                    id: call.id
                },
                data: {
                   status: "COMPLETED",
                    endedAt: new Date(),
                    duration
                }
            });

        console.log(
            `Call ${call.id} ended by user ${userId}`
        );

        console.log(
            `Call duration: ${duration} seconds`
        );

        // Notify everyone in the room
        io.to(roomId).emit("call-ended", {

            callId: updatedCall.id,

            roomId,

            endedBy: Number(userId),

            startedAt: updatedCall.startedAt,

            endedAt: updatedCall.endedAt,

            duration: updatedCall.duration,

            status: updatedCall.status

        });

        // Remove everyone from Socket.IO room
        io.in(roomId).socketsLeave(roomId);

    } catch (error) {

        console.error(
            "END CALL ERROR:",
            error
        );

        socket.emit("call-error", {
            message: "Unable to end call"
        });

    }
});

// ==========================================
// DISCONNECT
// ==========================================

socket.on("disconnect", () => {

    console.log(
        "Socket disconnected:",
        socket.id
    );

    // Notify other participants in the rooms
    for (const roomId of socket.rooms) {

        if (roomId !== socket.id) {

            socket.to(roomId).emit(
                "participant-disconnected",
                {
                    socketId: socket.id
                }
            );

        }
    }

});
socket.on("end-call", async (data) => {
    try {
        const { roomId, userId } = data;

        if (!roomId || !userId) {
            socket.emit("call-error", {
                message: "roomId and userId are required"
            });
            return;
        }

        const call = await prisma.call.findUnique({
            where: {
                roomId
            }
        });

        if (!call) {
            socket.emit("call-error", {
                message: "Invalid call room"
            });
            return;
        }

        if (call.status === "ENDED") {
            socket.emit("call-error", {
                message: "Call has already ended"
            });
            return;
        }

        await prisma.call.update({
            where: {
                id: call.id
            },
            data: {
                status: "COMPLETED",
                endedAt: new Date()
            }
        });

        console.log(
            `Call ${call.id} ended by user ${userId}`
        );

        // Notify everyone in the call
        io.to(roomId).emit("call-ended", {
            callId: call.id,
            roomId,
            endedBy: Number(userId)
        });

        // Remove socket from room
        io.in(roomId).socketsLeave(roomId);

    } catch (error) {

        console.error(
            "END CALL ERROR:",
            error
        );

        socket.emit("call-error", {
            message: "Unable to end call"
        });
    }
});
});

// ==========================================
// ROUTES
// ==========================================

const authRoutes =
    require("./src/routes/authRoutes");

const userRoutes =
    require("./src/routes/userRoutes");

const prisonRoutes =
    require("./src/routes/prisonRoutes");

const inmateRoutes =
    require("./src/routes/inmateRoutes");

const familyRoutes =
    require("./src/routes/familyRoutes");

const scheduleRoutes =
    require("./src/routes/scheduleRoutes");

const callRoutes =
    require("./src/routes/callRoutes");

const billingRoutes =
    require("./src/routes/billingRoutes");

const recordingRoutes =
    require("./src/routes/recordingRoutes");

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/prisons",
    prisonRoutes
);

app.use(
    "/api/inmates",
    inmateRoutes
);

app.use(
    "/api/family",
    familyRoutes
);

app.use(
    "/api/schedules",
    scheduleRoutes
);

app.use(
    "/api/calls",
    callRoutes
);

app.use(
    "/api/billing",
    billingRoutes
);

app.use(
    "/api/recordings",
    recordingRoutes
);

// ==========================================
// TEST ROUTES
// ==========================================

app.post(
    "/api/prisons-test",
    (req, res) => {

        res.json({
            message:
                "Prison test route works"
        });

    }
);

app.get(
    "/api/prisons-test",
    (req, res) => {

        res.json({
            message:
                "GET prison test works"
        });

    }
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "Prison Video Calling Backend is running"
        });

    }
);

// ==========================================
// ROUTE LOAD LOGS
// ==========================================

console.log(
    "AUTH ROUTE LOADED:",
    typeof authRoutes
);

console.log(
    "PRISON ROUTE LOADED:",
    typeof prisonRoutes
);

console.log(
    "INMATE ROUTE LOADED:",
    typeof inmateRoutes
);

console.log(
    "FAMILY ROUTE LOADED:",
    typeof familyRoutes
);

console.log(
    "SCHEDULE ROUTE LOADED:",
    typeof scheduleRoutes
);

console.log(
    "CALL ROUTE LOADED:",
    typeof callRoutes
);

console.log(
    "BILLING ROUTE LOADED:",
    typeof billingRoutes
);

console.log(
    "RECORDING ROUTE LOADED:",
    typeof recordingRoutes
);

// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            "DATABASE_URL loaded:",
            !!process.env.DATABASE_URL
        );

    }
);