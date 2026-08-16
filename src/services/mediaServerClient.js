const { io } = require("socket.io-client");

const MEDIA_SERVER_URL =
    process.env.MEDIA_SERVER_URL || "http://localhost:6000";

let mediaSocket = null;

// ==========================================
// CONNECT TO MEDIA SERVER
// ==========================================

function connectMediaServer() {

    if (mediaSocket && mediaSocket.connected) {
        return mediaSocket;
    }

    console.log(
        `Connecting to Media Server: ${MEDIA_SERVER_URL}`
    );

    mediaSocket = io(MEDIA_SERVER_URL, {
        transports: ["websocket", "polling"],
        reconnection: true
    });

    mediaSocket.on("connect", () => {

        console.log(
            "Connected to Media Server:",
            mediaSocket.id
        );

    });

    mediaSocket.on("connect_error", (error) => {

        console.error(
            "Media Server connection error:",
            error.message
        );

    });

    mediaSocket.on("disconnect", (reason) => {

        console.log(
            "Disconnected from Media Server:",
            reason
        );

    });

    return mediaSocket;
}

// ==========================================
// GET SOCKET
// ==========================================

function getMediaSocket() {

    if (!mediaSocket) {
        return connectMediaServer();
    }

    return mediaSocket;
}

// ==========================================
// CREATE MEDIA ROOM
// ==========================================

function createMediaRoom(roomId) {

    return new Promise((resolve, reject) => {

        const socket = getMediaSocket();

        const request = {
            roomId
        };

        socket.emit(
            "create-media-room",
            request,
            (response) => {

                if (!response || !response.success) {

                    reject(
                        new Error(
                            response?.message ||
                            "Unable to create media room"
                        )
                    );

                    return;
                }

                resolve(response);
            }
        );
    });
}

// ==========================================
// CLOSE MEDIA ROOM
// ==========================================

function closeMediaRoom(roomId) {

    return new Promise((resolve, reject) => {

        const socket = getMediaSocket();

        socket.emit(
            "close-media-room",
            {
                roomId
            },
            (response) => {

                if (!response || !response.success) {

                    reject(
                        new Error(
                            response?.message ||
                            "Unable to close media room"
                        )
                    );

                    return;
                }

                resolve(response);
            }
        );
    });
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    connectMediaServer,
    getMediaSocket,
    createMediaRoom,
    closeMediaRoom
};