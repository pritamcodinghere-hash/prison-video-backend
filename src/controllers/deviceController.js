const prisma = require("../config/prisma");

const getDevices = async (req, res) => {
    try {
        const devices = await prisma.device.findMany({
            include: { prison: true },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ devices });

    } catch (error) {
        console.error("GET DEVICES ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const createDevice = async (req, res) => {
    try {
        const { deviceCode, name, prisonId } = req.body;

        if (!deviceCode || !name || !prisonId) {
            return res.status(400).json({ message: "deviceCode, name and prisonId are required" });
        }

        const existing = await prisma.device.findUnique({ where: { deviceCode } });

        if (existing) {
            return res.status(409).json({ message: "Device code already exists" });
        }

        const device = await prisma.device.create({
            data: { deviceCode, name, prisonId: Number(prisonId) }
        });

        return res.status(201).json({ message: "Device created", device });

    } catch (error) {
        console.error("CREATE DEVICE ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateDeviceStatus = async (req, res) => {
    try {
        const deviceId = Number(req.params.id);
        const { status } = req.body;

        const device = await prisma.device.update({
            where: { id: deviceId },
            data: { status, lastActiveAt: new Date() }
        });

        return res.status(200).json({ message: "Device updated", device });

    } catch (error) {
        console.error("UPDATE DEVICE ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getDevices, createDevice, updateDeviceStatus };
