const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const ROOM_ID = "room_059ca85a9599a55e";
const USER_ID = 2;

// ==========================================
// CONNECT
// ==========================================

socket.on("connect", () => {

    console.log(
        "END CALL TEST SOCKET CONNECTED:",
        socket.id
    );

    // End the active call
    socket.emit("end-call", {
        roomId: ROOM_ID,
        userId: USER_ID
    });

    console.log("END CALL REQUEST SENT");

});


// ==========================================
// CALL ENDED
// ==========================================

socket.on("call-ended", (data) => {

    console.log("CALL ENDED:");
    console.log(data);

    // Disconnect test socket
    socket.disconnect();

});


// ==========================================
// CALL ERROR
// ==========================================

socket.on("call-error", (data) => {

    console.log("CALL ERROR:");
    console.log(data);

    socket.disconnect();

});


// ==========================================
// DISCONNECT
// ==========================================

socket.on("disconnect", () => {

    console.log(
        "END CALL TEST SOCKET DISCONNECTED"
    );

});