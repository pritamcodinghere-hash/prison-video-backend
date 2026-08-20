const prisma = require("../config/prisma");

const getInmateById = async (req, res) => {
    try {
        const inmateId = Number(req.params.id);

        const inmate = await prisma.inmate.findUnique({
            where: { id: inmateId },
            include: { prison: true }
        });

        if (!inmate) {
            return res.status(404).json({ message: "Inmate not found" });
        }

        return res.status(200).json({ inmate });

    } catch (error) {
        console.error("GET INMATE ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getInmateContacts = async (req, res) => {
    try {
        const inmateId = Number(req.params.id);

        const contacts = await prisma.familyMember.findMany({
            where: {
                inmateId,
                verificationStatus: "VERIFIED"
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, phone: true }
                }
            }
        });

        return res.status(200).json({ contacts });

    } catch (error) {
        console.error("GET INMATE CONTACTS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getInmateById, getInmateContacts };
