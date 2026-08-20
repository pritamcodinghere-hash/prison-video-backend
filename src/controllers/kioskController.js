const prisma = require("../config/prisma");

const verifyKiosk = async (req, res) => {
    try {
        const { serialNumber } = req.body;

        if (!serialNumber) {
            return res.status(400).json({ message: "serialNumber is required" });
        }

        const kiosk = await prisma.kiosk.findUnique({
            where: { serialNumber }
        });

        if (!kiosk) {
            return res.status(200).json({ authorized: false, message: "Kiosk not registered" });
        }

        if (kiosk.status === "APPROVED") {
            return res.status(200).json({ authorized: true, kiosk });
        }

        return res.status(200).json({ authorized: false, message: `Kiosk status: ${kiosk.status}` });

    } catch (error) {
        console.error("VERIFY KIOSK ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const registerKiosk = async (req, res) => {
    try {
        const { serialNumber, prisonId, name } = req.body;

        if (!serialNumber || !prisonId) {
            return res.status(400).json({ message: "serialNumber and prisonId are required" });
        }

        const existing = await prisma.kiosk.findUnique({ where: { serialNumber } });

        if (existing) {
            return res.status(409).json({ message: "Kiosk already registered", kiosk: existing });
        }

        const kiosk = await prisma.kiosk.create({
            data: {
                serialNumber,
                prisonId: Number(prisonId),
                name: name || null,
                status: "PENDING"
            }
        });

        return res.status(201).json({ message: "Kiosk registered successfully", kiosk });

    } catch (error) {
        console.error("REGISTER KIOSK ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getRegistrationStatus = async (req, res) => {
    try {
        const { serialNumber } = req.params;

        const kiosk = await prisma.kiosk.findUnique({
            where: { serialNumber }
        });

        if (!kiosk) {
            return res.status(404).json({ message: "Kiosk not found" });
        }

        return res.status(200).json({ status: kiosk.status });

    } catch (error) {
        console.error("GET KIOSK STATUS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getKiosks = async (req, res) => {
    try {
        const kiosks = await prisma.kiosk.findMany({
            include: { prison: true },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ kiosks });

    } catch (error) {
        console.error("GET KIOSKS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateKioskStatus = async (req, res) => {
    try {
        const kioskId = Number(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }

        const allowedStatuses = ["PENDING", "APPROVED", "REJECTED", "OFFLINE"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const kiosk = await prisma.kiosk.update({
            where: { id: kioskId },
            data: { status }
        });

        return res.status(200).json({ message: "Kiosk status updated", kiosk });

    } catch (error) {
        console.error("UPDATE KIOSK STATUS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { verifyKiosk, registerKiosk, getRegistrationStatus, getKiosks, updateKioskStatus };
