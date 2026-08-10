const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "prison_video_secret_key";

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

module.exports = {
    generateToken
};