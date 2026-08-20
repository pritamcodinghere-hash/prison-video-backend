const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { generateToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

// In-memory refresh tokens store (use DB/Redis in production)
const refreshTokenStore = new Set();

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.status === "BLOCKED" || user.status === "INACTIVE") {
            return res.status(403).json({
                message: "Account is blocked or inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        refreshTokenStore.add(refreshToken);

        return res.status(200).json({
            message: "Login successful",
            token,
            refreshToken,
            expiresIn: 86400,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                status: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({ user });

    } catch (error) {
        console.error("GET ME ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            if (token) {
                tokenBlacklist.add(token);
            }
        }

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Refresh token required"
            });
        }

        if (!refreshTokenStore.has(token)) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            refreshTokenStore.delete(token);
            return res.status(401).json({
                message: "Refresh token expired"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        refreshTokenStore.delete(token);

        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokenStore.add(newRefreshToken);

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 86400,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("REFRESH TOKEN ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(200).json({
                message: "If the email exists, a reset link has been sent"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

        return res.status(200).json({
            message: "If the email exists, a reset link has been sent",
            resetToken,
            expiresAt: resetExpires
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        return res.status(200).json({
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    loginUser,
    getMe,
    logoutUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    tokenBlacklist
};
