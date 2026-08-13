const prisma = require("../config/prisma");

const createPrison = async (req, res) => {
    try {
        console.log("PRISON API HIT");
        console.log("BODY:", req.body);

        const { name, code, address } = req.body;

        if (!name || !code || !address) {
            return res.status(400).json({
                message: "Name, code and address are required"
            });
        }

        const existingPrison = await prisma.prison.findUnique({
            where: { code }
        });

        if (existingPrison) {
            return res.status(409).json({
                message: "Prison code already exists"
            });
        }

        const prison = await prisma.prison.create({
            data: {
                name,
                code,
                address
            }
        });

        return res.status(201).json({
            message: "Prison created successfully",
            prison
        });

    } catch (error) {
        console.error("CREATE PRISON ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// GET ALL PRISONS
const getPrisons = async (req, res) => {
    try {
        const prisons = await prisma.prison.findMany({
            orderBy: {
                id: "asc"
            }
        });

        return res.status(200).json({
            message: "Prisons fetched successfully",
            prisons
        });

    } catch (error) {
        console.error("GET PRISONS ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createPrison,
    getPrisons
};