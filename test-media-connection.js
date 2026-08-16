require("dotenv").config();

const {
    connectMediaServer
} = require("./src/services/mediaServerClient");

console.log("=================================");
console.log("APPLICATION -> MEDIA SERVER TEST");
console.log("=================================");

const socket = connectMediaServer();

socket.on("connect", () => {

    console.log("");
    console.log("APPLICATION SERVER CONNECTED");
    console.log(
        "Media Server Socket ID:",
        socket.id
    );

    setTimeout(() => {

        socket.disconnect();

        console.log("");
        console.log("TEST PASSED");

        process.exit(0);

    }, 1000);
});

socket.on("connect_error", (error) => {

    console.error(
        "TEST FAILED:",
        error.message
    );

    process.exit(1);
});