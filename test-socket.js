const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const ROOM_ID = "room_862bea92ed8d8d1f";
const USER_ID = 2;
const ROLE = "VISITOR";

// ==========================================
// SOCKET CONNECTED
// ==========================================

socket.on("connect", () => {

    console.log(
        "Socket connected:",
        socket.id
    );

    // ==========================================
    // JOIN ACTIVE CALL
    // ==========================================

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

    console.log("CALL JOINED:");
    console.log(data);

    // ==========================================
    // TEST WEBRTC OFFER
    // ==========================================

    socket.emit("offer", {
        roomId: data.roomId,
        offer: {
            type: "offer",
            sdp: "TEST_SDP_OFFER"
        }
    });

    console.log("TEST OFFER SENT");


    // ==========================================
    // TEST ICE CANDIDATE
    // ==========================================

    socket.emit("ice-candidate", {
        roomId: data.roomId,
        candidate: {
            candidate: "TEST_ICE_CANDIDATE",
            sdpMid: "0",
            sdpMLineIndex: 0
        }
    });

    console.log("TEST ICE CANDIDATE SENT");

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

    console.log("OFFER RECEIVED:");
    console.log(data);

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

    console.log("ICE CANDIDATE RECEIVED:");
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
// SOCKET DISCONNECTED
// ==========================================

socket.on("disconnect", () => {

    console.log(
        "Socket disconnected"
    );

});