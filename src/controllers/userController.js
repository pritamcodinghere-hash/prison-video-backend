const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const VALID_ROLES = ["VISITOR", "WARDEN", "VENDOR", "KIOSK"];
const ADMIN_ROLES = ["WARDEN", "VENDOR", "KIOSK"];

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const userRole = role && VALID_ROLES.includes(role) ? role : "VISITOR";

        if (ADMIN_ROLES.includes(userRole)) {
            if (!req.user || !["ADMIN", "SUPER_ADMIN", "WARDEN"].includes(req.user.role)) {
                return res.status(403).json({
                    message: "Only admins can register warden/vendor/kiosk users"
                });
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: userRole
            }
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    registerUser
};