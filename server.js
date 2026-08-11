require("dotenv").config();

const express = require("express");
const app = express();

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const prisonRoutes = require("./src/routes/prisonRoutes");
const inmateRoutes = require("./src/routes/inmateRoutes");
const familyRoutes = require("./src/routes/familyRoutes");
const scheduleRoutes = require("./src/routes/scheduleRoutes");
const callRoutes = require("./src/routes/callRoutes");
// Middleware
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inmates", inmateRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/calls", callRoutes);
// TEST ROUTE
app.post("/api/prisons-test", (req, res) => {
    res.json({
        message: "Prison test route works"
    });
});

// Prison routes
app.use("/api/prisons", prisonRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Prison Video Calling Backend is running"
    });
});

// Server
console.log("PRISON ROUTE LOADED:", typeof prisonRoutes);
console.log("INMATE ROUTE LOADED:", typeof inmateRoutes);
console.log("FAMILY ROUTE LOADED:", typeof familyRoutes);
console.log("SCHEDULE ROUTE LOADED:", typeof scheduleRoutes);
console.log("CALL ROUTE LOADED:", typeof callRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(
        "DATABASE_URL loaded:",
        !!process.env.DATABASE_URL
    );
});