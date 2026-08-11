const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const createFamilyMember = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            phone,
            relationship,
            inmateId
        } = req.body;

        if (
            !fullName ||
            !email ||
            !password ||
            !phone ||
            !relationship ||
            !inmateId
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check inmate
        const inmate = await prisma.inmate.findUnique({
            where: {
                id: Number(inmateId)
            }
        });

        if (!inmate) {
            return res.status(404).json({
                message: "Inmate not found"
            });
        }

        // Check existing user
        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User + FamilyMember together
        const result = await prisma.$transaction(async (tx) => {

            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    password: hashedPassword,
                    role: "VISITOR"
                }
            });

            const familyMember = await tx.familyMember.create({
                data: {
                    userId: user.id,
                    inmateId: Number(inmateId),
                    relationship,
                    phone,
                    verificationStatus: "PENDING"
                }
            });

            return { user, familyMember };
        });

        return res.status(201).json({
            message: "Family member created successfully",
            familyMember: {
                id: result.familyMember.id,
                userId: result.user.id,
                fullName: result.user.fullName,
                email: result.user.email,
                phone: result.familyMember.phone,
                relationship: result.familyMember.relationship,
                inmateId: result.familyMember.inmateId,
                verificationStatus:
                    result.familyMember.verificationStatus
            }
        });

    } catch (error) {
        console.error("FAMILY MEMBER ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// SEND OTP
// ==========================================

const sendOtp = async (req, res) => {
    try {
        const { familyMemberId } = req.body;

        if (!familyMemberId) {
            return res.status(400).json({
                message: "familyMemberId is required"
            });
        }

        const familyMember = await prisma.familyMember.findUnique({
            where: {
                id: Number(familyMemberId)
            }
        });

        if (!familyMember) {
            return res.status(404).json({
                message: "Family member not found"
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP expires after 5 minutes
        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await prisma.familyMember.update({
            where: {
                id: Number(familyMemberId)
            },
            data: {
                otpCode: otp,
                otpExpiresAt: expiresAt
            }
        });

        // Development only
        console.log(
            `OTP for FamilyMember ${familyMemberId}: ${otp}`
        );

        return res.status(200).json({
            message: "OTP generated successfully",
            expiresAt,
            otp
        });

    } catch (error) {
        console.error("SEND OTP ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// VERIFY OTP
// ==========================================

const verifyOtp = async (req, res) => {
    try {
        const {
            familyMemberId,
            otp
        } = req.body;

        if (!familyMemberId || !otp) {
            return res.status(400).json({
                message: "familyMemberId and otp are required"
            });
        }

        const familyMember = await prisma.familyMember.findUnique({
            where: {
                id: Number(familyMemberId)
            }
        });

        if (!familyMember) {
            return res.status(404).json({
                message: "Family member not found"
            });
        }

        // Check if OTP exists
        if (
            !familyMember.otpCode ||
            !familyMember.otpExpiresAt
        ) {
            return res.status(400).json({
                message: "No OTP generated"
            });
        }

        // Check expiry
        if (new Date() > familyMember.otpExpiresAt) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        // Check OTP
        if (
            familyMember.otpCode !== otp.toString()
        ) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // Mark family member as verified
        await prisma.familyMember.update({
            where: {
                id: Number(familyMemberId)
            },
            data: {
                verificationStatus: "VERIFIED",

                // Clear OTP after successful verification
                otpCode: null,
                otpExpiresAt: null
            }
        });

        return res.status(200).json({
            message: "Family member verified successfully",
            familyMemberId: Number(familyMemberId),
            verificationStatus: "VERIFIED"
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createFamilyMember,
    sendOtp,
    verifyOtp
};