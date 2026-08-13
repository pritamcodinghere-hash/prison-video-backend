const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const ROOM_ID = "room_862bea92ed8d8d1f";
const USER_ID = 1;
const ROLE = "INMATE";

// ==========================================
// SOCKET CONNECTED
// ==========================================

socket.on("connect", () => {

    console.log(
        "INMATE SOCKET CONNECTED:",
        socket.id
    );

    // Join the active call
    socket.emit("join-call", {
        roomId: ROOM_ID,
        userId: USER_ID,
        role: ROLE
    });

});


// ==========================================
// CALL JOINED
// ==========================================

socket.on("call-joined", (data) => {

    console.log("INMATE CALL JOINED:");
    console.log(data);

});


// ==========================================
// PARTICIPANT JOINED
// ==========================================

socket.on("participant-joined", (data) => {

    console.log("PARTICIPANT JOINED:");
    console.log(data);

});


// ==========================================
// OFFER RECEIVED
// ==========================================

socket.on("offer", (data) => {

    console.log("OFFER RECEIVED BY INMATE:");
    console.log(data);

    // Send test answer back to visitor
    socket.emit("answer", {
        roomId: ROOM_ID,
        answer: {
            type: "answer",
            sdp: "TEST_SDP_ANSWER"
        }
    });

    console.log("TEST ANSWER SENT");

});


// ==========================================
// ANSWER RECEIVED
// ==========================================

socket.on("answer", (data) => {

    console.log("ANSWER RECEIVED:");
    console.log(data);

});


// ==========================================
// ICE CANDIDATE RECEIVED
// ==========================================

socket.on("ice-candidate", (data) => {

    console.log(
        "ICE CANDIDATE RECEIVED BY INMATE:"
    );

    console.log(data);

});


// ==========================================
// PARTICIPANT LEFT
// ==========================================

socket.on("participant-left", (data) => {

    console.log("PARTICIPANT LEFT:");
    console.log(data);

});


// ==========================================
// PARTICIPANT DISCONNECTED
// ==========================================

socket.on("participant-disconnected", (data) => {

    console.log(
        "PARTICIPANT DISCONNECTED:"
    );

    console.log(data);

});


// ==========================================
// CALL ERROR
// ==========================================

socket.on("call-error", (data) => {

    console.log("CALL ERROR:");
    console.log(data);

});


// ==========================================
// DISCONNECT
// ==========================================

socket.on("disconnect", () => {

    console.log(
        "INMATE SOCKET DISCONNECTED"
    );

});