const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const registerUser = async (req, res) => {
    try {
        console.log("REGISTER BODY:", req.body);

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check existing user
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName: fullName,
                email: email,
                password: hashedPassword
            }
        });

        console.log("USER CREATED:", user.id);

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
        console.error("========== REGISTER ERROR ==========");
        console.error(error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    registerUser
};