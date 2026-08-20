const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "prison_video_calling_secret_2026";

const REFRESH_SECRET = process.env.REFRESH_SECRET || "prison_video_refresh_secret_2026";

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
    JWT_SECRET,
    REFRESH_SECRET,
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
};
