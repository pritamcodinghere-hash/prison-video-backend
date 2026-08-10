require("dotenv").config();
const authRoutes = require("./src/routes/authRoutes");
const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
// User routes
const userRoutes = require("./src/routes/userRoutes");

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Prison Video Calling Backend is running"
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);
});