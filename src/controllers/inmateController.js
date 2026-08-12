const prisma = require("../config/prisma");

const createInmate = async (req, res) => {
    try {
        const {
            inmateNumber,
            fullName,
            prisonId
        } = req.body;

        if (!inmateNumber || !fullName || !prisonId) {
            return res.status(400).json({
                message: "Inmate number, full name and prison ID are required"
            });
        }

        const existingInmate = await prisma.inmate.findUnique({
            where: {
                inmateNumber
            }
        });

        if (existingInmate) {
            return res.status(409).json({
                message: "Inmate number already exists"
            });
        }

        const inmate = await prisma.inmate.create({
            data: {
                inmateNumber,
                fullName,
                prisonId: Number(prisonId)
            }
        });

        return res.status(201).json({
            message: "Inmate created successfully",
            inmate
        });

    } catch (error) {
        console.error("CREATE INMATE ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// GET ALL INMATES
const getInmates = async (req, res) => {
    try {
        const inmates = await prisma.inmate.findMany({
            include: {
                prison: true
            },
            orderBy: {
                id: "asc"
            }
        });

        return res.status(200).json({
            message: "Inmates fetched successfully",
            inmates
        });

    } catch (error) {
        console.error("GET INMATES ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createInmate,
    getInmates
};