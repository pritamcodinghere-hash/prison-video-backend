require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const prisma = require("./src/config/prisma");

const app = express();
const server = http.createServer(app);

// Map to track active per-minute billing tickers
const activeBillingTimers = new Map();

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

            if (!roomId || !userId || !role) {
                socket.emit("call-error", {
                    message: "roomId, userId and role are required"
                });
                return;
            }

            const call = await prisma.call.findUnique({
                where: { roomId }
            });

            if (!call) {
                socket.emit("call-error", {
                    message: "Invalid call room"
                });
                return;
            }

            if (call.status !== "ACTIVE") {
                socket.emit("call-error", {
                    message: "Call is not active"
                });
                return;
            }

            const numericUserId = Number(userId);
            let validParticipant = false;

            if (role === "VISITOR") {
                const familyMember = await prisma.familyMember.findFirst({
                    where: {
                        id: call.familyMemberId,
                        userId: numericUserId
                    }
                });
                validParticipant = !!familyMember;
            }

            if (role === "INMATE") {
                const inmate = await prisma.inmate.findFirst({
                    where: { id: call.inmateId }
                });
                validParticipant = !!inmate && inmate.id === numericUserId;
            }

            if (!validParticipant) {
                socket.emit("call-error", {
                    message: "User is not authorized for this call"
                });
                return;
            }

            socket.join(roomId);
            console.log(`User ${userId} joined call ${call.id} in room ${roomId} as ${role}`);

            socket.emit("call-joined", {
                callId: call.id,
                roomId,
                userId: numericUserId,
                role
            });

            socket.to(roomId).emit("participant-joined", {
                userId: numericUserId,
                role
            });

            // Start Per-Minute Billing Ticker if both parties connected
            const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
            if (socketsInRoom && socketsInRoom.size >= 2 && !activeBillingTimers.has(roomId)) {
                console.log(`💳 Starting Real-Time Billing Ticker for Room ${roomId}`);
                
                const ratePerMin = 2.0; // ₹2.00 per minute
                let elapsedMinutes = 0;

                const timer = setInterval(async () => {
                    elapsedMinutes += 1;
                    const totalCharge = elapsedMinutes * ratePerMin;

                    console.log(`⏱️ Minute ${elapsedMinutes} ticked for Room ${roomId}. Total Charge: ₹${totalCharge}`);

                    io.to(roomId).emit("billing-update", {
                        elapsedMinutes,
                        totalCharge,
                        ratePerMin
                    });

                    // Check balance limit (5 minutes max)
                    if (elapsedMinutes >= 5) {
                        console.log(`⏰ Max duration reached for Room ${roomId}. Auto-ending call...`);
                        clearInterval(timer);
                        activeBillingTimers.delete(roomId);
                        
                        io.to(roomId).emit("call-ended", {
                            roomId,
                            reason: "MAX_TIME_REACHED"
                        });
                        io.in(roomId).socketsLeave(roomId);
                    }
                }, 60000); // Every 60 seconds

                activeBillingTimers.set(roomId, timer);
            }

        } catch (error) {
            console.error("JOIN CALL ERROR:", error);
            socket.emit("call-error", { message: "Unable to join call" });
        }
    });

    // ==========================================
    // WEBRTC OFFER / ANSWER / ICE CANDIDATES
    // ==========================================
    socket.on("offer", (data) => {
        const { roomId, offer } = data;
        if (!roomId || !offer) return socket.emit("call-error", { message: "roomId and offer required" });
        socket.to(roomId).emit("offer", { offer });
    });

    socket.on("answer", (data) => {
        const { roomId, answer } = data;
        if (!roomId || !answer) return socket.emit("call-error", { message: "roomId and answer required" });
        socket.to(roomId).emit("answer", { answer });
    });

    socket.on("ice-candidate", (data) => {
        const { roomId, candidate } = data;
        if (!roomId || !candidate) return socket.emit("call-error", { message: "roomId and candidate required" });
        socket.to(roomId).emit("ice-candidate", { candidate });
    });

    socket.on("leave-call", (data) => {
        const { roomId, userId, role } = data;
        if (!roomId) return;
        socket.leave(roomId);
        socket.to(roomId).emit("participant-left", { userId, role });
    });

    // ==========================================
    // END CALL (Clean Single Event Handler)
    // ==========================================
    socket.on("end-call", async (data) => {
        try {
            const { roomId, userId } = data;
            if (!roomId || !userId) return socket.emit("call-error", { message: "roomId and userId required" });

            const call = await prisma.call.findUnique({ where: { roomId } });
            if (!call || call.status === "ENDED" || call.status === "COMPLETED") {
                return socket.emit("call-error", { message: "Call invalid or already ended" });
            }

            // Stop Billing Ticker
            if (activeBillingTimers.has(roomId)) {
                clearInterval(activeBillingTimers.get(roomId));
                activeBillingTimers.delete(roomId);
            }

            let duration = 0;
            if (call.startedAt) {
                duration = Math.floor((new Date() - new Date(call.startedAt)) / 1000);
            }

            const updatedCall = await prisma.call.update({
                where: { id: call.id },
                data: {
                    status: "COMPLETED",
                    endedAt: new Date(),
                    duration
                }
            });

            console.log(`Call ${call.id} ended by user ${userId}. Duration: ${duration} seconds`);

            io.to(roomId).emit("call-ended", {
                callId: updatedCall.id,
                roomId,
                endedBy: Number(userId),
                duration: updatedCall.duration,
                status: updatedCall.status
            });

            io.in(roomId).socketsLeave(roomId);
        } catch (error) {
            console.error("END CALL ERROR:", error);
            socket.emit("call-error", { message: "Unable to end call" });
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// ==========================================
// API ROUTES
// ==========================================
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const prisonRoutes = require("./src/routes/prisonRoutes");
const inmateRoutes = require("./src/routes/inmateRoutes");
const familyRoutes = require("./src/routes/familyRoutes");
const scheduleRoutes = require("./src/routes/scheduleRoutes");
const callRoutes = require("./src/routes/callRoutes");
const billingRoutes = require("./src/routes/billingRoutes");
const recordingRoutes = require("./src/routes/recordingRoutes");

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/prisons", prisonRoutes);
app.use("/api/inmates", inmateRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/recordings", recordingRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Prison Video Calling Backend is running" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});